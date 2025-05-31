import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import crypto from 'crypto';

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

// Helper function to get human-readable refund status messages
function getRefundStatusMessage(status) {
  const statusMessages = {
    'created': 'Reembolso creado',
    'pending': 'Reembolso pendiente',
    'accepted': 'Reembolso aceptado',
    'rejected': 'Reembolso rechazado',
    'cancelled': 'Reembolso cancelado',
    'completed': 'Reembolso completado',
    'expired': 'Reembolso expirado'
  };
  return statusMessages[status] || `Estado: ${status}`;
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

    // Note: This endpoint can be used by admins or users checking their own refunds
    // For full admin access, you might want to add role checks

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

    // Prepare Flow.cl get refund status parameters
    const statusParams = {
      apiKey: FLOW_CONFIG.apiKey,
      token
    };

    // Generate signature
    const signature = generateSignature(statusParams, FLOW_CONFIG.secretKey);
    statusParams.s = signature;

    // Make request to Flow.cl API
    const flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/refund/getStatus?${new URLSearchParams(statusParams)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow.cl get refund status API error:', errorText);
      throw new Error('Error al consultar el estado del reembolso');
    }

    const refundStatus = await flowResponse.json();

    if (!refundStatus.token) {
      console.error('Invalid Flow.cl refund status response:', refundStatus);
      throw new Error('Respuesta inválida de Flow.cl');
    }

    // Enhanced response with additional information
    const response = {
      success: true,
      refundInfo: {
        token: refundStatus.token,
        flowRefundOrder: refundStatus.flowRefundOrder,
        status: refundStatus.status,
        statusMessage: getRefundStatusMessage(refundStatus.status),
        amount: refundStatus.amount,
        fee: refundStatus.fee,
        date: refundStatus.date,
        // Add any additional fields from the response
        ...refundStatus
      }
    };

    // Log the status check for audit purposes
    console.log(`Refund status checked by ${session.user.email}:`, {
      token: refundStatus.token,
      flowRefundOrder: refundStatus.flowRefundOrder,
      status: refundStatus.status,
      amount: refundStatus.amount
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting Flow.cl refund status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 