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

// Helper function to get detailed error messages
function getErrorMessage(errorCode) {
  const errorMessages = {
    '-1': 'Tarjeta inválida',
    '-11': 'Excede límite de reintentos de rechazos',
    '-2': 'Error de conexión',
    '-3': 'Excede monto máximo',
    '-4': 'Fecha de expiración inválida',
    '-5': 'Problema en autenticación',
    '-6': 'Rechazo general',
    '-7': 'Tarjeta bloqueada',
    '-8': 'Tarjeta vencida',
    '-9': 'Transacción no soportada',
    '-10': 'Problema en la transacción',
    '999': 'Error desconocido'
  };
  return errorMessages[errorCode.toString()] || 'Error no especificado';
}

// Helper function to get human-readable status messages
function getStatusMessage(status) {
  const statusMessages = {
    1: 'Pago pendiente',
    2: 'Pago aprobado',
    3: 'Pago rechazado',
    4: 'Pago cancelado',
    5: 'Pago reversado'
  };
  return statusMessages[status] || 'Estado desconocido';
}

export async function POST(request) {
  try {
    // Check authentication (only allow admins or the payment owner)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { token, commerceOrder, flowOrder } = await request.json();

    // Validate input - need at least one identifier
    if (!token && !commerceOrder && !flowOrder) {
      return NextResponse.json(
        { success: false, error: 'Se requiere token, commerceOrder o flowOrder' },
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

    let paymentStatus;
    let endpoint;
    let params;

    // Determine which endpoint to use based on available parameters
    if (token) {
      endpoint = 'payment/getStatusExtended';
      params = {
        apiKey: FLOW_CONFIG.apiKey,
        token
      };
    } else if (flowOrder) {
      endpoint = 'payment/getStatusByFlowOrderExtended';
      params = {
        apiKey: FLOW_CONFIG.apiKey,
        flowOrder: parseInt(flowOrder)
      };
    } else if (commerceOrder) {
      endpoint = 'payment/getStatusByCommerceId';
      params = {
        apiKey: FLOW_CONFIG.apiKey,
        commerceId: commerceOrder
      };
    }

    // Generate signature and make request
    const signature = generateSignature(params, FLOW_CONFIG.secretKey);
    params.s = signature;

    const flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params)
    });

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow.cl status check error:', errorText);
      throw new Error('Error al consultar el estado del pago');
    }

    paymentStatus = await flowResponse.json();

    // Format response with additional information
    const response = {
      success: true,
      paymentInfo: {
        flowOrder: paymentStatus.flowOrder,
        commerceOrder: paymentStatus.commerceOrder,
        status: paymentStatus.status,
        statusMessage: getStatusMessage(paymentStatus.status),
        subject: paymentStatus.subject,
        amount: paymentStatus.amount,
        currency: paymentStatus.currency,
        payer: paymentStatus.payer,
        requestDate: paymentStatus.requestDate,
        merchantId: paymentStatus.merchantId
      }
    };

    // Add payment data if available (from extended services)
    if (paymentStatus.paymentData) {
      response.paymentInfo.paymentDetails = {
        date: paymentStatus.paymentData.date,
        media: paymentStatus.paymentData.media,
        mediaType: paymentStatus.paymentData.mediaType,
        cardLast4Numbers: paymentStatus.paymentData.cardLast4Numbers,
        installments: paymentStatus.paymentData.installments,
        authorizationCode: paymentStatus.paymentData.autorizationCode,
        fee: paymentStatus.paymentData.fee,
        balance: paymentStatus.paymentData.balance,
        transferDate: paymentStatus.paymentData.transferDate
      };
    }

    // Add error information if payment failed
    if (paymentStatus.lastError && paymentStatus.lastError.code) {
      response.paymentInfo.errorDetails = {
        code: paymentStatus.lastError.code,
        message: paymentStatus.lastError.message || getErrorMessage(paymentStatus.lastError.code),
        medioCode: paymentStatus.lastError.medioCode
      };
    }

    // Add pending info if available
    if (paymentStatus.pending_info) {
      response.paymentInfo.pendingInfo = paymentStatus.pending_info;
    }

    // Add optional data
    if (paymentStatus.optional) {
      response.paymentInfo.optional = paymentStatus.optional;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting payment status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 