import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { createSubscriptionSafely } from '../../../../lib/dbUtils';

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
    console.log('🔍 Flow.cl webhook - Starting processing...');
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('🔍 Request URL:', request.url);
    
    // Parse form data from Flow.cl webhook
    const formData = await request.formData();
    const params = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    console.log('🔍 Flow.cl webhook received raw params:', params);
    console.log('🔍 Number of parameters received:', Object.keys(params).length);

    // Check if we have a signature
    if (!params.s) {
      console.error('❌ Missing signature in webhook data');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Extract signature and remove it from params for verification
    const receivedSignature = params.s;
    const verificationParams = { ...params };
    delete verificationParams.s;

    console.log('🔍 Received signature:', receivedSignature);
    console.log('🔍 Parameters for verification:', verificationParams);

    // Validate Flow.cl configuration
    if (!FLOW_CONFIG.secretKey) {
      console.error('❌ Flow.cl secret key not configured');
      console.log('🔍 FLOW_CONFIG:', {
        hasApiKey: !!FLOW_CONFIG.apiKey,
        hasSecretKey: !!FLOW_CONFIG.secretKey,
        apiUrl: FLOW_CONFIG.apiUrl
      });
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    console.log('🔍 Attempting signature verification...');
    const isSignatureValid = verifyWebhookSignature(verificationParams, receivedSignature, FLOW_CONFIG.secretKey);
    console.log('🔍 Signature verification result:', isSignatureValid);
    
    if (!isSignatureValid) {
      console.error('❌ Invalid webhook signature');
      console.log('🔍 Expected signature would be generated from:', verificationParams);
      console.log('🔍 Received signature:', receivedSignature);
      
      // Generate expected signature for debugging
      const expectedSignature = generateSignature(verificationParams, FLOW_CONFIG.secretKey);
      console.log('🔍 Expected signature:', expectedSignature);
      
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const { token, status } = params;

    if (!token) {
      console.error('❌ Missing token in webhook');
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    console.log('✅ Webhook validation passed, processing payment...');

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
          // Check if optional is already an object or a string  
          if (typeof paymentStatus.optional === 'object') {
            planData = paymentStatus.optional;
            console.log('📦 Plan data from Flow.cl webhook (object):', planData);
          } else {
            planData = JSON.parse(paymentStatus.optional || '{}');
            console.log('📦 Plan data from Flow.cl webhook (parsed):', planData);
          }
        } catch (e) {
          console.error('Error parsing optional data:', e);
          planData = {};
        }

        const { userId, planId, planName } = planData;

        if (userId && planId) {
          // Use the safe subscription creation function (imported at top)
          const subscriptionResult = await createSubscriptionSafely({
            userId: userId,
            planId: planId,
            paymentId: paymentStatus.flowOrder || paymentStatus.commerceOrder,
            amount: parseInt(paymentStatus.amount) || 0,
            currency: paymentStatus.currency || 'CLP',
            context: 'webhook'
          });

          if (subscriptionResult.success) {
            console.log(`✅ Successfully processed subscription for user ${userId} to plan ${planId}`, {
              commerceOrder: paymentStatus.commerceOrder,
              flowOrder: paymentStatus.flowOrder,
              amount: paymentStatus.amount,
              paymentMedia: paymentStatus.paymentData?.media,
              mediaType: paymentStatus.paymentData?.mediaType,
              cardLast4: paymentStatus.paymentData?.cardLast4Numbers,
              subscriptionId: subscriptionResult.subscription.id
            });
          } else {
            console.error('Failed to create subscription:', subscriptionResult.error);
          }

          // Log the payment separately (always create payment log for record keeping)
          console.log('💾 Attempting to create PaymentLog in webhook with data:', {
            userId: userId,
            planId: planId,
            amount: paymentStatus.amount,
            currency: paymentStatus.currency || 'CLP',
            flowToken: token?.substring(0, 10) + '...',
            commerceOrder: paymentStatus.commerceOrder,
            flowOrder: paymentStatus.flowOrder,
            status: 'completed'
          });

          try {
            const paymentLogResult = await prisma.paymentLog.create({
              data: {
                userId: userId,
                planId: planId,
                amount: parseInt(paymentStatus.amount) || 0,
                currency: paymentStatus.currency || 'CLP',
                flowToken: token,
                commerceOrder: paymentStatus.commerceOrder,
                status: 'completed',
                paymentDate: new Date(),
                flowOrder: paymentStatus.flowOrder ? paymentStatus.flowOrder.toString() : null
              }
            });

            console.log('✅ PaymentLog created successfully in webhook:', {
              id: paymentLogResult.id,
              flowToken: paymentLogResult.flowToken?.substring(0, 10) + '...',
              commerceOrder: paymentLogResult.commerceOrder,
              status: paymentLogResult.status
            });
          } catch (paymentLogError) {
            console.error('❌ Critical error creating PaymentLog in webhook:', paymentLogError);
            console.error('📋 PaymentLog data that failed:', {
              userId: userId,
              planId: planId,
              amount: paymentStatus.amount,
              currency: paymentStatus.currency || 'CLP',
              flowToken: token,
              commerceOrder: paymentStatus.commerceOrder,
              status: 'completed',
              flowOrder: paymentStatus.flowOrder
            });
            
            // Log additional debugging info
            console.error('🔍 Detailed webhook error analysis:', {
              errorName: paymentLogError.name,
              errorMessage: paymentLogError.message,
              errorCode: paymentLogError.code,
              isPrismaError: paymentLogError.name?.includes('Prisma'),
              constraints: paymentLogError.meta?.target || 'none'
            });
            
            // This is critical for payment tracking
            console.error('🚨 WEBHOOK PAYMENT TRACKING FAILURE - This payment will not be properly logged in PaymentLog table');
          }
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