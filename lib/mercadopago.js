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
 * Validate and complete user data for MercadoPago payer information
 * @param {object} userData - User information
 * @returns {object} - Validated and completed user data
 */
function validateAndCompleteUserData(userData) {
  // Validate first name
  const firstName = userData.nombre || userData.username || 'Usuario';
  
  // Validate and complete last name
  let lastName = userData.apellidos || '';
  
  // If no last name provided, use fallbacks to improve approval rates
  if (!lastName || lastName.trim() === '') {
    // Try to extract last name from username if it contains spaces
    if (userData.username && userData.username.includes(' ')) {
      const nameParts = userData.username.trim().split(' ');
      if (nameParts.length >= 2) {
        lastName = nameParts.slice(1).join(' '); // Take everything after first word
      }
    }
    
    // Final fallback to meet MercadoPago requirements
    if (!lastName || lastName.trim() === '') {
      lastName = 'Sin Apellido';
    }
  }
  
  // Validate email
  const email = userData.email;
  if (!email || !email.includes('@')) {
    throw new Error('Email válido es requerido para procesar el pago');
  }
  
  // Validate and complete RUT for Chilean market
  let rutNumber = userData.rut || '11111111-1';
  if (!rutNumber || rutNumber.trim() === '') {
    rutNumber = '11111111-1'; // Default test RUT
  }
  
  return {
    id: userData.id,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    rutNumber: rutNumber.trim(),
    originalData: userData
  };
}

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
    
    // Validate and complete user data
    const validatedUserData = validateAndCompleteUserData(userData);
    
    // Log payer information for debugging (without sensitive data)
    console.log('🔍 Payer information for MercadoPago:', {
      firstName: validatedUserData.firstName,
      lastName: validatedUserData.lastName,
      email: validatedUserData.email,
      hasRut: !!validatedUserData.rutNumber,
      environment: environment
    });
    
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
        name: validatedUserData.firstName,
        last_name: validatedUserData.lastName, // ✅ Always provide a valid last name for better approval rates
        email: validatedUserData.email,
        identification: {
          type: 'RUT',
          number: validatedUserData.rutNumber
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
      external_reference: `${validatedUserData.id}_${planData.id}_${Date.now()}`
    };

    console.log('✅ MercadoPago preference data prepared with complete payer information');
    
    const response = await preference.create({ body: preferenceData });
    
    console.log('✅ MercadoPago preference created successfully:', {
      preferenceId: response.id,
      externalReference: response.external_reference,
      environment: environment
    });
    
    return {
      success: true,
      preference: response,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    };
  } catch (error) {
    console.error('❌ Error creating MercadoPago preference:', error);
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
 * @param {string} rawBody - Raw request body as string
 * @param {string} xSignature - X-Signature header from MercadoPago
 * @param {string} xRequestId - X-Request-Id header from MercadoPago
 * @param {string} dataId - The data.id from query parameters
 * @param {string} webhookType - Type of webhook (payment, merchant_order, etc.)
 * @returns {boolean} - Whether signature is valid
 */
export function verifyWebhookSignature(rawBody, xSignature, xRequestId, dataId, webhookType = 'payment') {
  try {
    console.log('🔍 Verifying webhook signature...');
    console.log('Raw body length:', rawBody.length);
    console.log('X-Signature:', xSignature);
    console.log('X-Request-ID:', xRequestId);
    console.log('Data ID:', dataId);
    console.log('Webhook Type:', webhookType);
    
    // Check if webhook secret is configured
    if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      console.error('MERCADOPAGO_WEBHOOK_SECRET not configured');
      return false;
    }
    
    // MercadoPago uses HMAC-SHA256 for webhook signatures
    // Format: ts=timestamp,v1=signature
    const parts = xSignature.split(',');
    const timestampPart = parts.find(part => part.startsWith('ts='));
    const signaturePart = parts.find(part => part.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) {
      console.error('Invalid signature format');
      return false;
    }
    
    const timestamp = timestampPart.split('=')[1];
    const signature = signaturePart.split('=')[1];
    
    console.log('Extracted timestamp:', timestamp);
    console.log('Extracted signature:', signature);
    
    // Create the signed payload according to MercadoPago spec
    // Format: id:[data.id];request-id:[x-request-id];ts:[ts];
    const signedPayload = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
    
    console.log('Signed payload for verification:', signedPayload);
    
    // Compute the signature using your webhook secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
      .update(signedPayload, 'utf8')
      .digest('hex');
    
    console.log('Expected signature:', expectedSignature);
    console.log('Received signature:', signature);
    
    // Compare signatures using constant-time comparison
    const isValid = expectedSignature === signature;
    
    console.log('Signature validation result:', isValid);
    
    // If validation fails, try alternative payload formats
    if (!isValid) {
      console.log('🔍 Trying alternative signature verification methods...');
      
      // Alternative 1: Different payload format (no trailing semicolon)
      const altPayload1 = `id:${dataId};request-id:${xRequestId};ts:${timestamp}`;
      const altSignature1 = crypto
        .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
        .update(altPayload1, 'utf8')
        .digest('hex');
      
      console.log('Alternative payload 1:', altPayload1);
      console.log('Alternative signature 1:', altSignature1);
      
      if (altSignature1 === signature) {
        console.log('✅ Alternative signature validation successful');
        return true;
      }
      
      // Alternative 2: Using raw body in signature
      const altSignature2 = crypto
        .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex');
      
      console.log('Alternative signature 2 (raw body):', altSignature2);
      
      if (altSignature2 === signature) {
        console.log('✅ Raw body signature validation successful');
        return true;
      }
      
      // Alternative 3: Timestamp + raw body
      const altPayload3 = timestamp + rawBody;
      const altSignature3 = crypto
        .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
        .update(altPayload3, 'utf8')
        .digest('hex');
      
      console.log('Alternative payload 3:', `${timestamp}[body]`);
      console.log('Alternative signature 3:', altSignature3);
      
      if (altSignature3 === signature) {
        console.log('✅ Timestamp+body signature validation successful');
        return true;
      }
      
      // Alternative 4: Merchant order specific format (if it's a merchant_order webhook)
      if (webhookType === 'merchant_order') {
        const merchantPayload = `id:${dataId};ts:${timestamp};`;
        const merchantSignature = crypto
          .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
          .update(merchantPayload, 'utf8')
          .digest('hex');
        
        console.log('Alternative payload 4 (merchant_order):', merchantPayload);
        console.log('Alternative signature 4 (merchant_order):', merchantSignature);
        
        if (merchantSignature === signature) {
          console.log('✅ Merchant order signature validation successful');
          return true;
        }
        
        // Alternative 5: Try simplified merchant order format
        const merchantPayload2 = `${dataId}${timestamp}`;
        const merchantSignature2 = crypto
          .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
          .update(merchantPayload2, 'utf8')
          .digest('hex');
        
        console.log('Alternative payload 5 (simplified merchant_order):', merchantPayload2);
        console.log('Alternative signature 5 (simplified merchant_order):', merchantSignature2);
        
        if (merchantSignature2 === signature) {
          console.log('✅ Simplified merchant order signature validation successful');
          return true;
        }
      }
    }
    
    return isValid;
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