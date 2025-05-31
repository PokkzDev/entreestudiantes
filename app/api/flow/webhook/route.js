import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Flow.cl configuration
const FLOW_CONFIG = {
  apiKey: process.env.FLOW_API_KEY,
  secretKey: process.env.FLOW_API_SECRET,
  apiUrl: process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api'
};

// Generate Flow.cl signature for verification
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

// Verify the webhook signature
function verifyWebhookSignature(params, receivedSignature, secretKey) {
  const expectedSignature = generateSignature(params, secretKey);
  return expectedSignature === receivedSignature;
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

export async function POST(request) {
  try {
    // Parse form data from Flow.cl webhook
    const formData = await request.formData();
    const params = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    console.log('Flow.cl webhook received:', params);

    // Extract signature and remove it from params for verification
    const receivedSignature = params.s;
    const verificationParams = { ...params };
    delete verificationParams.s;

    // Validate Flow.cl configuration
    if (!FLOW_CONFIG.secretKey) {
      console.error('Flow.cl secret key not configured');
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(verificationParams, receivedSignature, FLOW_CONFIG.secretKey)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const { token, status } = params;

    if (!token) {
      console.error('Missing token in webhook');
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    // Get payment details from Flow.cl using extended service
    let paymentStatus;
    try {
      paymentStatus = await getExtendedPaymentStatus(
        token,
        FLOW_CONFIG.secretKey,
        FLOW_CONFIG.apiUrl,
        FLOW_CONFIG.apiKey
      );
    } catch (error) {
      console.error('Error fetching payment status from Flow.cl:', error);
      return NextResponse.json(
        { success: false, error: 'Flow API error' },
        { status: 500 }
      );
    }

    // Log payment status for debugging
    console.log('Payment status received:', {
      status: paymentStatus.status,
      amount: paymentStatus.amount,
      commerceOrder: paymentStatus.commerceOrder
    });

    // Only process approved payments
    if (paymentStatus.status === 2) { // 2 = approved
      try {
        // Parse optional data to get plan information
        let planData;
        try {
          planData = JSON.parse(paymentStatus.optional || '{}');
        } catch (e) {
          console.error('Error parsing optional data:', e);
          planData = {};
        }

        const { userId, planId, planName } = planData;

        if (userId && planId) {
          // Calculate subscription end date (30 days from now)
          const subscriptionEndDate = new Date();
          subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

          // Update user subscription
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: planId,
              subscriptionActive: true,
              subscriptionEndDate: subscriptionEndDate,
            }
          });

          // Log the payment
          await prisma.paymentLog.create({
            data: {
              userId: userId,
              planId: planId,
              amount: paymentStatus.amount,
              currency: paymentStatus.currency || 'CLP',
              flowToken: token,
              commerceOrder: paymentStatus.commerceOrder,
              status: 'completed',
              paymentDate: new Date(),
              subscriptionEndDate: subscriptionEndDate,
              flowOrder: paymentStatus.flowOrder ? paymentStatus.flowOrder.toString() : null
            }
          }).catch(error => {
            console.error('Error logging payment in webhook:', error);
            // Don't fail the webhook if logging fails
          });

          console.log(`Successfully updated subscription for user ${userId} to plan ${planId}`, {
            commerceOrder: paymentStatus.commerceOrder,
            flowOrder: paymentStatus.flowOrder,
            amount: paymentStatus.amount,
            paymentMedia: paymentStatus.paymentData?.media,
            mediaType: paymentStatus.paymentData?.mediaType,
            cardLast4: paymentStatus.paymentData?.cardLast4Numbers
          });
        }
      } catch (error) {
        console.error('Error processing approved payment:', error);
        // Don't return error to Flow.cl to avoid retries
      }
    } else {
      // Log failed payments with detailed error information
      console.log('Payment not approved:', {
        status: paymentStatus.status,
        token: token,
        commerceOrder: paymentStatus.commerceOrder || 'unknown',
        flowOrder: paymentStatus.flowOrder || 'unknown'
      });

      // Log detailed error information if available (from extended service)
      if (paymentStatus.lastError && paymentStatus.lastError.code) {
        const errorCode = paymentStatus.lastError.code;
        const errorMessage = paymentStatus.lastError.message || getErrorMessage(errorCode);
        
        console.log('Payment error details:', {
          errorCode: errorCode,
          errorMessage: errorMessage,
          medioCode: paymentStatus.lastError.medioCode || 'unknown',
          paymentMedia: paymentStatus.paymentData?.media || 'unknown'
        });
      }
    }

    // Always return success to Flow.cl to prevent retries
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return success to prevent Flow.cl retries
    return NextResponse.json({ success: true });
  }
}

// Handle GET requests (Flow.cl might send test requests)
export async function GET(request) {
  return NextResponse.json({ 
    success: true, 
    message: 'Flow.cl webhook endpoint active' 
  });
} 