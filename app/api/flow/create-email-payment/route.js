import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Flow.cl configuration
const FLOW_CONFIG = {
  apiKey: process.env.FLOW_API_KEY,
  secretKey: process.env.FLOW_API_SECRET,
  apiUrl: process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

// Get tier data from database only
async function getTierData(planId) {
  try {
    const tier = await prisma.accountTier.findUnique({
      where: { tierKey: planId }
    });
    
    if (tier) {
      return {
        name: tier.name,
        publicationLimit: tier.publicationLimit,
        price: tier.price,
        features: JSON.parse(tier.features),
        icon: tier.icon,
        color: tier.color,
        bgColor: tier.bgColor
      };
    }
  } catch (error) {
    console.error('Error fetching tier from database:', error);
  }
  
  return null;
}

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
  return `ENT-EMAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

    const { 
      planId, 
      email, 
      timeout, 
      forwardDaysAfter = 3, 
      forwardTimes = 2 
    } = await request.json();

    // Use session email if no email provided
    const payerEmail = email || session.user.email;

    // Get tier data from database
    const tier = await getTierData(planId);

    // Validate plan ID
    if (!planId || !tier) {
      return NextResponse.json(
        { success: false, error: 'Plan inválido o no encontrado en la base de datos' },
        { status: 400 }
      );
    }

    // Don't process free plan
    if (tier.price === 0) {
      return NextResponse.json(
        { success: false, error: 'El plan gratuito no requiere pago' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
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
    const subject = `Plan ${tier.name} - EntreEstudiantes (Cobro por Email)`;

    const paymentParams = {
      apiKey: FLOW_CONFIG.apiKey,
      commerceOrder,
      subject,
      currency: 'CLP',
      amount,
      email: payerEmail,
      urlConfirmation: `${FLOW_CONFIG.baseUrl}/api/flow/webhook`,
      urlReturn: `${FLOW_CONFIG.baseUrl}/planes?status=success&email=true`,
      optional: JSON.stringify({
        userId: session.user.id,
        planId,
        planName: tier.name,
        paymentType: 'email',
        requestedBy: session.user.email
      })
    };

    // Add follow-up email parameters if specified
    if (forwardDaysAfter && forwardDaysAfter > 0) {
      paymentParams.forward_days_after = forwardDaysAfter;
    }
    if (forwardTimes && forwardTimes > 0) {
      paymentParams.forward_times = forwardTimes;
    }

    // Add timeout if specified
    if (timeout && timeout > 0) {
      paymentParams.timeout = timeout;
    }

    // Generate signature
    const signature = generateSignature(paymentParams, FLOW_CONFIG.secretKey);
    paymentParams.s = signature;

    // Make request to Flow.cl API
    const flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/payment/createEmail`, {
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

    // Log the email payment creation
    console.log('Email payment created:', {
      commerceOrder,
      flowOrder: flowData.flowOrder,
      email: payerEmail,
      amount,
      planId,
      requestedBy: session.user.email
    });

    return NextResponse.json({
      success: true,
      message: `Cobro por email enviado a ${payerEmail}`,
      paymentInfo: {
        url: flowData.url,
        token: flowData.token,
        flowOrder: flowData.flowOrder,
        commerceOrder,
        amount,
        planId,
        email: payerEmail,
        subject,
        followUp: {
          forwardDaysAfter,
          forwardTimes
        },
        timeout: timeout || null
      }
    });

  } catch (error) {
    console.error('Error creating Flow.cl email payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 