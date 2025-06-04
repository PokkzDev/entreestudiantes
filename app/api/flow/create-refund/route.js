import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Flow.cl configuration
const FLOW_CONFIG = {
  apiKey: process.env.FLOW_API_KEY,
  secretKey: process.env.FLOW_API_SECRET,
  apiUrl: process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

// Generate Flow.cl signature
function generateSignature(params, secretKey) {
  // Sort parameters by key (alphabetically)
  const sortedKeys = Object.keys(params).sort();
  
  // Concatenate as: keyvalue keyvalue (without separators)
  const stringToSign = sortedKeys
    .map(key => `${key}${params[key]}`)
    .join('');
  
  // Create HMAC SHA256 signature
  return crypto
    .createHmac('sha256', secretKey)
    .update(stringToSign)
    .digest('hex');
}

// Generate refund commerce order ID
function generateRefundCommerceOrder() {
  return `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check - refunds should be admin-only
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Acceso denegado - Solo administradores pueden crear reembolsos' },
    //     { status: 403 }
    //   );
    // }

    const { 
      receiverEmail, 
      amount, 
      commerceTrxId, 
      flowTrxId, 
      reason 
    } = await request.json();

    // Validate required parameters
    if (!receiverEmail || !amount) {
      return NextResponse.json(
        { success: false, error: 'Email del receptor y monto son requeridos' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(receiverEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validate amount
    const refundAmount = parseInt(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Monto inválido' },
        { status: 400 }
      );
    }

    // Validate that we have either commerceTrxId or flowTrxId
    if (!commerceTrxId && !flowTrxId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere commerceTrxId o flowTrxId de la transacción original' },
        { status: 400 }
      );
    }

    // Validate Flow.cl configuration
    if (!FLOW_CONFIG.apiKey || !FLOW_CONFIG.secretKey) {
      console.error('Flow.cl configuration missing');
      return NextResponse.json(
        { success: false, error: 'Configuración de pagos no disponible' },
        { status: 500 }
      );
    }

    // If we have commerceTrxId, try to find the payment in our database
    let originalPayment = null;
    if (commerceTrxId) {
      try {
        originalPayment = await prisma.paymentLog.findFirst({
          where: { commerceOrder: commerceTrxId },
          include: { user: true }
        });
      } catch (error) {
        console.error('Error finding original payment:', error);
      }
    }

    // Prepare Flow.cl refund parameters
    const refundCommerceOrder = generateRefundCommerceOrder();

    const refundParams = {
      apiKey: FLOW_CONFIG.apiKey,
      refundCommerceOrder,
      receiverEmail,
      amount: refundAmount,
      urlCallBack: `${FLOW_CONFIG.baseUrl}/api/flow/refund-webhook`
    };

    // Add transaction identifiers
    if (commerceTrxId) {
      refundParams.commerceTrxId = commerceTrxId;
    }
    if (flowTrxId) {
      refundParams.flowTrxId = flowTrxId;
    }

    // Generate signature
    const signature = generateSignature(refundParams, FLOW_CONFIG.secretKey);
    refundParams.s = signature;

    // Make request to Flow.cl API
    const flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/refund/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(refundParams)
    });

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow.cl refund API error:', errorText);
      throw new Error('Error de comunicación con Flow.cl');
    }

    const refundData = await flowResponse.json();

    if (!refundData.token) {
      console.error('Invalid Flow.cl refund response:', refundData);
      throw new Error('Respuesta inválida de Flow.cl');
    }

    // Log the refund creation
    console.log('Refund created:', {
      refundCommerceOrder,
      flowRefundOrder: refundData.flowRefundOrder,
      token: refundData.token,
      receiverEmail,
      amount: refundAmount,
      originalTransaction: commerceTrxId || flowTrxId,
      requestedBy: session.user.email,
      reason: reason || 'No especificado'
    });

    // Create a refund log entry
    try {
      await prisma.refundLog.create({
        data: {
          refundCommerceOrder,
          flowRefundOrder: refundData.flowRefundOrder?.toString(),
          token: refundData.token,
          receiverEmail,
          amount: refundAmount,
          originalCommerceOrder: commerceTrxId,
          originalFlowOrder: flowTrxId,
          status: refundData.status,
          createdBy: session.user.id,
          reason: reason || null,
          fee: refundData.fee ? Math.round(parseFloat(refundData.fee) * 100) : null // Convert to cents
        }
      });
    } catch (error) {
      console.error('Error logging refund:', error);
      // Don't fail the refund creation if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Reembolso creado para ${receiverEmail}`,
      refundInfo: {
        token: refundData.token,
        flowRefundOrder: refundData.flowRefundOrder,
        refundCommerceOrder,
        status: refundData.status,
        amount: refundAmount,
        fee: refundData.fee,
        date: refundData.date,
        receiverEmail,
        originalTransaction: {
          commerceTrxId: commerceTrxId || null,
          flowTrxId: flowTrxId || null
        },
        originalPaymentInfo: originalPayment ? {
          userId: originalPayment.userId,
          userEmail: originalPayment.user?.email,
          planId: originalPayment.planId,
          originalAmount: originalPayment.amount
        } : null
      }
    });

  } catch (error) {
    console.error('Error creating Flow.cl refund:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 