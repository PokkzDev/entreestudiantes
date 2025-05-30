import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import crypto from 'crypto';

// Initialize MercadoPago client
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { 
    timeout: 5000, 
    idempotencyKey: 'abc'
  },
  // Set environment based on MERCADOPAGO_ENVIRONMENT variable
  sandbox: process.env.MERCADOPAGO_ENVIRONMENT !== 'production'
});

// Create preference instance
const preference = new Preference(client);

// Create payment instance
const payment = new Payment(client);

/**
 * Create MercadoPago preference for a subscription plan
 * @param {object} planData - Plan information
 * @param {object} userData - User information
 * @returns {object} - MercadoPago preference response
 */
export async function createSubscriptionPreference(planData, userData) {
  try {
    // Log the environment being used
    const environment = process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox';
    console.log(`Creating MercadoPago preference in ${environment} environment`);
    
    const preferenceData = {
      items: [
        {
          id: planData.id,
          title: `Plan ${planData.name} - Entre Estudiantes`,
          description: `Suscripción mensual al plan ${planData.name}`,
          category_id: 'services',
          quantity: 1,
          unit_price: planData.price,
          currency_id: 'CLP'
        }
      ],
      payer: {
        name: userData.nombre || userData.username || 'Usuario',
        last_name: userData.apellidos || '',
        email: userData.email,
        identification: {
          type: 'RUT',
          number: userData.rut || '11111111-1'
        }
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/planes?payment=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/planes?payment=error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/planes?payment=pending`
      },
      // Enable automatic redirection for approved payments (redirects within 40 seconds)
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      external_reference: `${userData.id}_${planData.id}_${Date.now()}`
    };

    const response = await preference.create({ body: preferenceData });
    return {
      success: true,
      preference: response,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    };
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify payment status
 * @param {string} paymentId - MercadoPago payment ID
 * @returns {object} - Payment status information
 */
export async function verifyPayment(paymentId) {
  try {
    // Validate payment ID format
    if (!paymentId || typeof paymentId !== 'string') {
      throw new Error('Invalid payment ID provided');
    }

    // Get environment from environment variable (sandbox or production)
    const environment = process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox';
    
    console.log(`Verifying payment ID: ${paymentId}`);
    console.log(`Using ${environment} environment`);
    
    // Use the SDK's payment.get method which automatically handles the correct environment
    const paymentData = await payment.get({ id: paymentId });
    
    console.log(`Payment verification successful. Status: ${paymentData.status}`);
    
    return {
      success: true,
      payment: paymentData,
      status: paymentData.status,
      approved: paymentData.status === 'approved'
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // Handle specific MercadoPago errors
    if (error.message?.includes('404') || error.status === 404) {
      return {
        success: false,
        error: `Payment not found. Payment ID: ${paymentId}. Check if the payment exists and if you're using the correct environment (${process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox'}).`
      };
    } else if (error.message?.includes('401') || error.status === 401) {
      return {
        success: false,
        error: `Unauthorized. Check your MercadoPago access token.`
      };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred during payment verification'
    };
  }
}

/**
 * Parse external reference to extract user and plan information
 * @param {string} external_reference - External reference from MercadoPago
 * @returns {object} - Parsed reference data
 */
export function parseExternalReference(external_reference) {
  try {
    console.log(`Parsing external reference: ${external_reference}`);
    const [userId, planId, timestamp] = external_reference.split('_');
    
    const result = {
      userId: userId, // Keep as string since user IDs are CUIDs
      planId,
      timestamp: parseInt(timestamp)
    };
    
    console.log(`Parsed reference data:`, result);
    return result;
  } catch (error) {
    console.error('Error parsing external reference:', error);
    return null;
  }
}

/**
 * Verify MercadoPago webhook signature
 * @param {object} request - Request object
 * @param {string} xSignature - X-Signature header from MercadoPago
 * @param {string} xRequestId - X-Request-Id header from MercadoPago
 * @returns {boolean} - Whether signature is valid
 */
export function verifyWebhookSignature(request, xSignature, xRequestId) {
  try {
    // MercadoPago uses HMAC-SHA256 for webhook signatures
    // Format: ts=timestamp,v1=signature
    const parts = xSignature.split(',');
    const timestamp = parts.find(part => part.startsWith('ts=')).split('=')[1];
    const signature = parts.find(part => part.startsWith('v1=')).split('=')[1];
    
    // Create the signed payload
    const signedPayload = `${timestamp}.${xRequestId}.${JSON.stringify(request.body)}`;
    
    // Compute the signature using your webhook secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex');
    
    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Check if a payment has already been processed
 * @param {string} paymentId - MercadoPago payment ID
 * @param {object} prisma - Prisma client instance
 * @returns {object} - Information about existing subscription
 */
export async function checkPaymentProcessed(paymentId, prisma) {
  try {
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        paymentId: paymentId.toString()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            accountTier: true
          }
        }
      }
    });

    return {
      processed: !!existingSubscription,
      subscription: existingSubscription
    };
  } catch (error) {
    console.error('Error checking payment processed status:', error);
    return {
      processed: false,
      subscription: null,
      error: error.message
    };
  }
}

export { client }; 