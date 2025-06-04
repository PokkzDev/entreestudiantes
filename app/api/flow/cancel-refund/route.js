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
  apiUrl: process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api'
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

    // TODO: Add admin role check - refund cancellation should be admin-only
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Acceso denegado - Solo administradores pueden cancelar reembolsos' },
    //     { status: 403 }
    //   );
    // }

    const { token } = await request.json();

    // Validate required parameters
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token del reembolso es requerido' },
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

    // Prepare Flow.cl cancel refund parameters
    const cancelParams = {
      apiKey: FLOW_CONFIG.apiKey,
      token
    };

    // Generate signature
    const signature = generateSignature(cancelParams, FLOW_CONFIG.secretKey);
    cancelParams.s = signature;

    // Make request to Flow.cl API
    const flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/refund/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(cancelParams)
    });

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow.cl cancel refund API error:', errorText);
      throw new Error('Error de comunicación con Flow.cl');
    }

    const cancelData = await flowResponse.json();

    if (!cancelData.token) {
      console.error('Invalid Flow.cl cancel refund response:', cancelData);
      throw new Error('Respuesta inválida de Flow.cl');
    }

    // Log the refund cancellation
    console.log('Refund cancelled:', {
      token: cancelData.token,
      flowRefundOrder: cancelData.flowRefundOrder,
      status: cancelData.status,
      cancelledBy: session.user.email,
      date: cancelData.date
    });

    // Update refund log
    try {
      await prisma.refundLog.updateMany({
        where: { token: token },
        data: { 
          status: cancelData.status,
          cancelledBy: session.user.id,
          cancelledAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating refund log:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Reembolso cancelado exitosamente',
      refundInfo: {
        token: cancelData.token,
        flowRefundOrder: cancelData.flowRefundOrder,
        status: cancelData.status,
        amount: cancelData.amount,
        fee: cancelData.fee,
        date: cancelData.date,
        cancelledBy: session.user.email
      }
    });

  } catch (error) {
    console.error('Error cancelling Flow.cl refund:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 