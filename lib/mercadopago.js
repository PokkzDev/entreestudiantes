import { MercadoPagoConfig, Preference } from 'mercadopago';
import crypto from 'crypto';

// Initialize MercadoPago client
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000, idempotencyKey: 'abc' }
});

// Create preference instance
const preference = new Preference(client);

/**
 * Create MercadoPago preference for a subscription plan
 * @param {object} planData - Plan information
 * @param {object} userData - User information
 * @returns {object} - MercadoPago preference response
 */
export async function createSubscriptionPreference(planData, userData) {
  try {
    const preferenceData = {
      items: [
        {
          id: planData.id,
          title: `Plan ${planData.name} - Entre Estudiantes`,
          description: `Suscripción mensual al plan ${planData.name}`,
          quantity: 1,
          unit_price: planData.price,
          currency_id: 'CLP'
        }
      ],
      payer: {
        name: userData.name,
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
    const payment = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      }
    });
    
    if (!payment.ok) {
      throw new Error(`Payment verification failed: ${payment.status}`);
    }
    
    const paymentData = await payment.json();
    
    return {
      success: true,
      payment: paymentData,
      status: paymentData.status,
      approved: paymentData.status === 'approved'
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error.message
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
    const [userId, planId, timestamp] = external_reference.split('_');
    return {
      userId: parseInt(userId),
      planId,
      timestamp: parseInt(timestamp)
    };
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
      .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET || '')
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

export { client }; 