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

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
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

    // Check payment status with Flow.cl using extended service for better error info
    let paymentStatus;
    try {
      paymentStatus = await getExtendedPaymentStatus(
        token, 
        FLOW_CONFIG.secretKey, 
        FLOW_CONFIG.apiUrl, 
        FLOW_CONFIG.apiKey
      );
    } catch (error) {
      console.error('Flow.cl status check error:', error);
      throw new Error('Error al verificar el estado del pago');
    }

    // Check if payment was successful
    if (paymentStatus.status !== 2) { // 2 = approved in Flow.cl
      let errorDetails = {
        success: false,
        error: 'Pago no aprobado',
        status: paymentStatus.status,
        statusMessage: getStatusMessage(paymentStatus.status)
      };

      // Add detailed error information if available (from extended service)
      if (paymentStatus.lastError && paymentStatus.lastError.code) {
        const errorCode = paymentStatus.lastError.code;
        const errorMessage = paymentStatus.lastError.message || getErrorMessage(errorCode);
        
        errorDetails.errorCode = errorCode;
        errorDetails.errorMessage = errorMessage;
        errorDetails.detailedError = `${errorMessage} (Código: ${errorCode})`;
        
        // Add media code if available
        if (paymentStatus.lastError.medioCode) {
          errorDetails.medioCode = paymentStatus.lastError.medioCode;
        }
      }

      // Log failed payment attempt for debugging
      console.log('Payment verification failed:', {
        token: token,
        status: paymentStatus.status,
        commerceOrder: paymentStatus.commerceOrder,
        flowOrder: paymentStatus.flowOrder,
        errorDetails: errorDetails
      });

      return NextResponse.json(errorDetails);
    }

    // Parse optional data to get plan information
    let planData;
    try {
      planData = JSON.parse(paymentStatus.optional || '{}');
    } catch (e) {
      console.error('Error parsing optional data:', e);
      planData = {};
    }

    const { userId, planId, planName } = planData;

    // Verify the user matches
    if (userId !== session.user.id) {
      console.error('User ID mismatch in payment verification');
      return NextResponse.json(
        { success: false, error: 'Error de verificación de usuario' },
        { status: 400 }
      );
    }

    // Update user subscription in database
    let subscriptionUpdated = false;
    try {
      // Calculate subscription end date (30 days from now)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionTier: planId,
          subscriptionActive: true,
          subscriptionEndDate: subscriptionEndDate,
        }
      });

      // Prepare payment log data with extended information
      const paymentLogData = {
        userId: session.user.id,
        planId: planId,
        amount: paymentStatus.amount,
        currency: paymentStatus.currency || 'CLP',
        flowToken: token,
        commerceOrder: paymentStatus.commerceOrder,
        status: 'completed',
        paymentDate: new Date(),
        subscriptionEndDate: subscriptionEndDate
      };

      // Add Flow order number if available
      if (paymentStatus.flowOrder) {
        paymentLogData.flowOrder = paymentStatus.flowOrder.toString();
      }

      // Log the payment for record keeping
      await prisma.paymentLog.create({
        data: paymentLogData
      }).catch(error => {
        console.error('Error logging payment:', error);
        // Don't fail the whole operation if logging fails
      });

      subscriptionUpdated = true;

      // Log successful payment with extended details
      console.log('Payment verification successful:', {
        userId: session.user.id,
        planId: planId,
        amount: paymentStatus.amount,
        commerceOrder: paymentStatus.commerceOrder,
        flowOrder: paymentStatus.flowOrder,
        paymentMedia: paymentStatus.paymentData?.media,
        mediaType: paymentStatus.paymentData?.mediaType,
        cardLast4: paymentStatus.paymentData?.cardLast4Numbers,
        installments: paymentStatus.paymentData?.installments
      });

    } catch (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la suscripción' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionUpdated,
      planId,
      planName,
      amount: paymentStatus.amount,
      commerceOrder: paymentStatus.commerceOrder,
      flowOrder: paymentStatus.flowOrder,
      // Include additional payment details from extended service
      paymentDetails: {
        media: paymentStatus.paymentData?.media,
        mediaType: paymentStatus.paymentData?.mediaType,
        cardLast4Numbers: paymentStatus.paymentData?.cardLast4Numbers,
        installments: paymentStatus.paymentData?.installments,
        authorizationCode: paymentStatus.paymentData?.autorizationCode,
        transferDate: paymentStatus.paymentData?.transferDate
      }
    });

  } catch (error) {
    console.error('Error verifying Flow.cl payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
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

// Get extended payment status with detailed error information
async function getExtendedPaymentStatus(token, secretKey, apiUrl, apiKey) {
  const statusParams = {
    apiKey: apiKey,
    token
  };

  const signature = generateSignature(statusParams, secretKey);
  statusParams.s = signature;

  const flowResponse = await fetch(`${apiUrl}/payment/getStatusExtended`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(statusParams)
  });

  if (!flowResponse.ok) {
    // Fallback to regular status if extended is not available
    const fallbackParams = {
      apiKey: apiKey,
      token
    };
    const fallbackSignature = generateSignature(fallbackParams, secretKey);
    fallbackParams.s = fallbackSignature;

    const fallbackResponse = await fetch(`${apiUrl}/payment/getStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(fallbackParams)
    });

    if (!fallbackResponse.ok) {
      throw new Error('Error al verificar el estado del pago');
    }

    return await fallbackResponse.json();
  }

  return await flowResponse.json();
} 