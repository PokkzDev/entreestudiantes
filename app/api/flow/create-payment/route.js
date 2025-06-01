import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ACCOUNT_TIERS } from '@/lib/accountTiers';
import crypto from 'crypto';

// Flow.cl configuration
// API Documentation: https://www.flow.cl/docs/api.html
const FLOW_CONFIG = {
  apiKey: process.env.FLOW_API_KEY,
  secretKey: process.env.FLOW_API_SECRET?.trim(), // Remove invisible whitespace
  apiUrl: process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

// Generate Flow.cl signature according to official documentation
// https://sandbox.flow.cl/docs/api.html#section/Introduccion/Autenticacion-y-Seguridad
function generateSignature(params, secretKey) {
  // CRITICAL: Exclude the 's' parameter from signature generation
  const paramsForSigning = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== 's')
  );
  
  // Sort parameters alphabetically by key name (CRITICAL: exact order matters)
  const sortedKeys = Object.keys(paramsForSigning).sort();
  
  // Concatenate parameters as: keyvalue keyvalue (no separators, no spaces, no =)
  // Flow.cl spec: "Nombre_del_parametro valor nombre_del_parametro valor"
  let stringToSign = '';
  for (const key of sortedKeys) {
    const value = String(paramsForSigning[key]);
    stringToSign += key + value;
  }
  
  // Create HMAC SHA256 signature
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(stringToSign, 'utf8')
    .digest('hex');
  
  // Debug logging
  console.log('=== Flow.cl Signature Generation Debug ===');
  console.log('1. Parameters for signing:', JSON.stringify(paramsForSigning, null, 2));
  console.log('2. Sorted keys:', sortedKeys);
  console.log('3. String to sign:', `"${stringToSign}"`);
  console.log('4. String length:', stringToSign.length);
  console.log('5. Secret key exists:', !!secretKey);
  console.log('6. Secret key length:', secretKey ? secretKey.length : 'N/A');
  console.log('7. Generated signature:', signature);
  console.log('==========================================');
  
  return signature;
}

// Generate commerce order ID
function generateCommerceOrder() {
  return `ENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Test function to validate signature generation with Flow.cl documentation example
function testFlowSignature() {
  console.log('=== Flow.cl Documentation Test ===');
  // Example from Flow.cl docs: "amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP"
  const testParams = {
    amount: 5000,
    apiKey: 'XXXX-XXXX-XXXX',
    currency: 'CLP'
  };
  
  const sortedKeys = Object.keys(testParams).sort();
  let testStringToSign = '';
  for (const key of sortedKeys) {
    testStringToSign += key + String(testParams[key]);
  }
  
  console.log('Test params:', testParams);
  console.log('Test sorted keys:', sortedKeys);
  console.log('Test string generated:', `"${testStringToSign}"`);
  console.log('Test string should be: "amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP"');
  console.log('String matches expected:', testStringToSign === 'amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP');
  
  const testSignature = crypto
    .createHmac('sha256', 'test-secret-key')
    .update(testStringToSign, 'utf8')
    .digest('hex');
  console.log('Test signature generated:', testSignature);
  console.log('=====================================');
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

    const { planId, paymentMethod = 9, timeout } = await request.json();

    // Validate plan ID
    if (!planId || !ACCOUNT_TIERS[planId]) {
      return NextResponse.json(
        { success: false, error: 'Plan inválido' },
        { status: 400 }
      );
    }

    const tier = ACCOUNT_TIERS[planId];

    // Don't process free plan
    if (tier.price === 0) {
      return NextResponse.json(
        { success: false, error: 'El plan gratuito no requiere pago' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Add specific payment method IDs as needed
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Método de pago inválido' },
        { status: 400 }
      );
    }

    // Validate timeout if provided
    if (timeout && (timeout < 60 || timeout > 86400)) { // 1 minute to 24 hours
      return NextResponse.json(
        { success: false, error: 'Timeout debe estar entre 60 y 86400 segundos' },
        { status: 400 }
      );
    }

    // Validate Flow.cl configuration
    if (!FLOW_CONFIG.apiKey || !FLOW_CONFIG.secretKey) {
      console.error('Flow.cl configuration missing');
      console.error('Missing:', {
        apiKey: !FLOW_CONFIG.apiKey ? 'FLOW_API_KEY env var missing' : 'present',
        secretKey: !FLOW_CONFIG.secretKey ? 'FLOW_API_SECRET env var missing' : 'present'
      });
      return NextResponse.json(
        { success: false, error: 'Configuración de pagos no disponible' },
        { status: 500 }
      );
    }

    // Debug: Log configuration (safely) and validate format
    console.log('Flow.cl Config Debug:');
    console.log('API Key format:', FLOW_CONFIG.apiKey ? `${FLOW_CONFIG.apiKey.substring(0, 8)}...` : 'missing');
    console.log('Secret Key format:', FLOW_CONFIG.secretKey ? `${FLOW_CONFIG.secretKey.substring(0, 8)}...` : 'missing');
    console.log('Secret Key length:', FLOW_CONFIG.secretKey ? FLOW_CONFIG.secretKey.length : 'N/A');
    console.log('Secret Key RAW (for debugging):', `"${FLOW_CONFIG.secretKey}"`);
    console.log('API URL:', FLOW_CONFIG.apiUrl);
    console.log('Base URL:', FLOW_CONFIG.baseUrl);
    
    // Validate baseUrl to prevent URL construction errors
    if (!FLOW_CONFIG.baseUrl) {
      console.error('Flow.cl baseUrl is missing or null');
      return NextResponse.json(
        { success: false, error: 'Configuración de URL base no disponible' },
        { status: 500 }
      );
    }
    
    // Validate baseUrl format
    try {
      new URL(FLOW_CONFIG.baseUrl);
    } catch (urlError) {
      console.error('Invalid baseUrl format:', FLOW_CONFIG.baseUrl, urlError);
      return NextResponse.json(
        { success: false, error: 'Configuración de URL base inválida' },
        { status: 500 }
      );
    }
    
    // Validate secret key format (should be hex string, typically 40 characters)
    if (FLOW_CONFIG.secretKey && !/^[a-f0-9]+$/i.test(FLOW_CONFIG.secretKey)) {
      console.warn('WARNING: Secret key does not appear to be a valid hex string');
      console.warn('Secret key format:', FLOW_CONFIG.secretKey.substring(0, 20) + '...');
      console.warn('Secret key contains non-hex characters');
    }
    
    // Clean secret key to remove any potential hidden characters
    const cleanSecretKey = FLOW_CONFIG.secretKey.replace(/[^a-f0-9]/gi, '');
    if (cleanSecretKey !== FLOW_CONFIG.secretKey) {
      console.warn('WARNING: Secret key contained non-hex characters, cleaned from', 
        FLOW_CONFIG.secretKey.length, 'to', cleanSecretKey.length, 'characters');
    }

    // Run Flow.cl documentation test
    testFlowSignature();

    // Prepare Flow.cl payment parameters - EXACT parameter names as per Flow.cl spec
    const commerceOrder = generateCommerceOrder();
    const amount = tier.price;
    
    // Clean subject - remove accents and special characters
    const cleanTierName = tier.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const subject = `Plan ${cleanTierName} - EntreEstudiantes`;
    const email = session.user.email;

    // Prepare optional data as clean JSON string (no extra spaces, consistent formatting)
    const optionalData = JSON.stringify({
      userId: session.user.id,
      planId,
      planName: cleanTierName,
      paymentType: 'direct'
    });

    console.log('→ Optional JSON that will be signed:', optionalData);
    console.log('→ Optional JSON length:', optionalData.length);

    // Construct and validate URLs before using them
    let urlConfirmation, urlReturn;
    try {
      urlConfirmation = `${FLOW_CONFIG.baseUrl}/api/flow/webhook`;
      urlReturn = `${FLOW_CONFIG.baseUrl}/api/flow/return`;
      
      // Validate URL construction
      new URL(urlConfirmation);
      new URL(urlReturn);
      
      console.log('→ Constructed URLs:');
      console.log('  - Confirmation URL:', urlConfirmation);
      console.log('  - Return URL:', urlReturn);
    } catch (urlConstructionError) {
      console.error('Failed to construct Flow.cl URLs:', urlConstructionError);
      console.error('Base URL used:', FLOW_CONFIG.baseUrl);
      throw new Error('Error en construcción de URLs de callback');
    }

    // CRITICAL: Use exact parameter names as per Flow.cl specification
    // These must be camelCase as documented: apiKey, commerceOrder, subject, currency, amount, email, paymentMethod, urlConfirmation, urlReturn, optional
    const paymentParams = {
      apiKey: FLOW_CONFIG.apiKey,
      commerceOrder: commerceOrder,
      subject: subject,
      currency: 'CLP',
      amount: amount,
      email: email,
      paymentMethod: paymentMethod,
      urlConfirmation: urlConfirmation,
      urlReturn: urlReturn,
      optional: optionalData
    };

    // Add timeout if specified (optional parameter)
    if (timeout && timeout > 0) {
      paymentParams.timeout = timeout;
    }

    console.log('→ Payment params before signing:', JSON.stringify(paymentParams, null, 2));

    // Generate signature BEFORE adding it to params
    const signature = generateSignature(paymentParams, cleanSecretKey);
    
    // Now add the signature to the parameters
    paymentParams.s = signature;

    // Debug: Log the exact request being sent to Flow.cl
    console.log('Flow.cl Request Debug:');
    console.log('API URL:', `${FLOW_CONFIG.apiUrl}/payment/create`);
    console.log('Payment params (with signature):', JSON.stringify(paymentParams, null, 2));

    // CRITICAL: Build URLSearchParams ensuring EXACT same values that were signed
    const urlParams = new URLSearchParams();
    
    // Add parameters in the EXACT same order and format as used for signature generation
    // We must ensure that String(value) here produces the same result as in generateSignature
    const sortedKeys = Object.keys(paymentParams).filter(key => key !== 's').sort();
    
    console.log('→ Sorted parameter keys for request:', sortedKeys);
    
    for (const key of sortedKeys) {
      const value = String(paymentParams[key]);
      urlParams.append(key, value);
      console.log(`→ Adding param: ${key}="${value}"`);
    }
    
    // Add signature last
    urlParams.append('s', paymentParams.s);
    console.log(`→ Adding signature: s="${paymentParams.s}"`);

    console.log('→ Final URL-encoded body:', urlParams.toString());
    
    // VERIFICATION: Check that the optional parameter in body matches what was signed
    const optionalInBody = urlParams.get('optional');
    if (optionalInBody !== optionalData) {
      console.error('CRITICAL ERROR: optional parameter in body differs from what was signed!');
      console.error('Signed:', optionalData);
      console.error('In body:', optionalInBody);
      throw new Error('Parameter mismatch between signature and request body');
    }

    // Make request to Flow.cl API with explicit encoding
    const flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json',
        'User-Agent': 'EntreEstudiantes/1.0'
      },
      body: urlParams.toString()
    });

    const responseText = await flowResponse.text();
    console.log('Flow.cl Raw Response:', responseText);

    if (!flowResponse.ok) {
      console.error('Flow.cl API error:', responseText);
      
      // Try to parse error response
      let errorMessage = 'Error de comunicación con Flow.cl';
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If it's not JSON, use the raw text if it's a reasonable length
        if (responseText.length < 200) {
          errorMessage = responseText;
        }
      }
      
      throw new Error(errorMessage);
    }

    let flowData;
    try {
      flowData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Flow.cl response:', responseText);
      throw new Error('Respuesta inválida de Flow.cl');
    }

    if (!flowData.url || !flowData.token) {
      console.error('Invalid Flow.cl response structure:', flowData);
      throw new Error('Respuesta inválida de Flow.cl - falta URL o token');
    }

    // Log the payment creation
    console.log('Direct payment created:', {
      commerceOrder,
      flowOrder: flowData.flowOrder,
      amount,
      planId,
      paymentMethod,
      timeout: timeout || 'no timeout',
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      url: flowData.url,
      token: flowData.token,
      flowOrder: flowData.flowOrder,
      commerceOrder,
      amount,
      planId,
      paymentMethod,
      timeout: timeout || null,
      expiresAt: timeout ? new Date(Date.now() + timeout * 1000).toISOString() : null
    });

  } catch (error) {
    console.error('Error creating Flow.cl payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 