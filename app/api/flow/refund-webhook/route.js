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

// Get refund status from Flow.cl
async function getRefundStatus(token, secretKey, apiUrl, apiKey) {
  const statusParams = {
    apiKey: apiKey,
    token
  };

  const signature = generateSignature(statusParams, secretKey);
  statusParams.s = signature;

  const flowResponse = await fetch(`${apiUrl}/refund/getStatus?${new URLSearchParams(statusParams)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  });

  if (!flowResponse.ok) {
    throw new Error('Error al verificar el estado del reembolso');
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

    console.log('Flow.cl refund webhook received:', params);

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
      console.error('Invalid refund webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const { token } = params;

    if (!token) {
      console.error('Missing token in refund webhook');
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    // Get refund details from Flow.cl
    let refundStatus;
    try {
      refundStatus = await getRefundStatus(
        token,
        FLOW_CONFIG.secretKey,
        FLOW_CONFIG.apiUrl,
        FLOW_CONFIG.apiKey
      );
    } catch (error) {
      console.error('Error fetching refund status from Flow.cl:', error);
      return NextResponse.json(
        { success: false, error: 'Flow API error' },
        { status: 500 }
      );
    }

    // Log refund status for debugging
    console.log('Refund status received:', {
      token: refundStatus.token,
      status: refundStatus.status,
      amount: refundStatus.amount,
      flowRefundOrder: refundStatus.flowRefundOrder
    });

    // Process the refund status update
    try {
      // Update refund log
      await prisma.refundLog.updateMany({
        where: { token: token },
        data: {
          status: refundStatus.status,
          updatedAt: new Date()
        }
      });

      // Handle different refund statuses
      switch (refundStatus.status) {
        case 'accepted':
          console.log(`Refund accepted: ${refundStatus.flowRefundOrder} - Amount: ${refundStatus.amount}`);
          // You might want to update user subscription status or send notification emails
          break;
          
        case 'rejected':
          console.log(`Refund rejected: ${refundStatus.flowRefundOrder} - Amount: ${refundStatus.amount}`);
          // Handle rejected refund - maybe notify admin
          break;
          
        case 'completed':
          console.log(`Refund completed: ${refundStatus.flowRefundOrder} - Amount: ${refundStatus.amount}`);
          // Final status - refund has been processed successfully
          break;
          
        case 'cancelled':
          console.log(`Refund cancelled: ${refundStatus.flowRefundOrder} - Amount: ${refundStatus.amount}`);
          // Handle cancelled refund
          break;
          
        case 'expired':
          console.log(`Refund expired: ${refundStatus.flowRefundOrder} - Amount: ${refundStatus.amount}`);
          // Handle expired refund
          break;
          
        default:
          console.log(`Refund status update: ${refundStatus.status} for ${refundStatus.flowRefundOrder}`);
      }

      // Here you might want to:
      // 1. Send email notifications to users/admins
      // 2. Update user subscription status (if applicable)
      // 3. Log the refund processing for audit purposes
      // 4. Update internal accounting systems

    } catch (error) {
      console.error('Error processing refund status:', error);
      // Don't fail the webhook - just log the error
    }

    // Always return success to Flow.cl to prevent retries
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Refund webhook processing error:', error);
    // Return success to prevent Flow.cl retries
    return NextResponse.json({ success: true });
  }
}

// Handle GET requests (Flow.cl might send test requests)
export async function GET(request) {
  return NextResponse.json({ 
    success: true, 
    message: 'Flow.cl refund webhook endpoint active' 
  });
} 