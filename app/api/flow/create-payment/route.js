import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ACCOUNT_TIERS } from '@/lib/accountTiers';
import crypto from 'crypto';

// Flow.cl configuration
const FLOW_CONFIG = {
  apiKey: process.env.FLOW_API_KEY,
  secretKey: process.env.FLOW_API_SECRET,
  apiUrl: process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
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

// Generate commerce order ID
function generateCommerceOrder() {
  return `ENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
      return NextResponse.json(
        { success: false, error: 'Configuración de pagos no disponible' },
        { status: 500 }
      );
    }

    // Prepare Flow.cl payment parameters
    const commerceOrder = generateCommerceOrder();
    const amount = tier.price;
    const subject = `Plan ${tier.name} - EntreEstudiantes`;
    const email = session.user.email;

    const paymentParams = {
      apiKey: FLOW_CONFIG.apiKey,
      commerceOrder,
      subject,
      currency: 'CLP',
      amount,
      email,
      paymentMethod: paymentMethod,
      urlConfirmation: `${FLOW_CONFIG.baseUrl}/api/flow/webhook`,
      urlReturn: `${FLOW_CONFIG.baseUrl}/planes?status=success`,
      optional: JSON.stringify({
        userId: session.user.id,
        planId,
        planName: tier.name,
        paymentType: 'direct'
      })
    };

    // Add timeout if specified
    if (timeout && timeout > 0) {
      paymentParams.timeout = timeout;
    }

    // Generate signature
    const signature = generateSignature(paymentParams, FLOW_CONFIG.secretKey);
    paymentParams.s = signature;

    // Make request to Flow.cl API
    const flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paymentParams)
    });

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow.cl API error:', errorText);
      throw new Error('Error de comunicación con Flow.cl');
    }

    const flowData = await flowResponse.json();

    if (!flowData.url || !flowData.token) {
      console.error('Invalid Flow.cl response:', flowData);
      throw new Error('Respuesta inválida de Flow.cl');
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