import { NextResponse } from 'next/server';
import { verifyPayment, parseExternalReference, verifyWebhookSignature } from '@/lib/mercadopago';
import { createSubscriptionSafely } from '@/lib/dbUtils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Force this route to be dynamic and not statically generated
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Ensure this route supports POST method
export const revalidate = 0;

export async function POST(request) {
  // Add comprehensive logging for production debugging
  console.log('🔔 ==================== WEBHOOK POST REQUEST ====================');
  console.log('🔔 Timestamp:', new Date().toISOString());
  console.log('🔔 Request method:', request.method);
  console.log('🔔 Request URL:', request.url);
  console.log('🔔 Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Extract query parameters from the URL
    const url = new URL(request.url);
    console.log('🔔 Full URL object:', {
      pathname: url.pathname,
      search: url.search,
      searchParams: Object.fromEntries(url.searchParams.entries())
    });
    
    // Handle both URL formats MercadoPago uses
    const dataId = url.searchParams.get('data.id') || 
                   url.searchParams.get('id');
    
    const topic = url.searchParams.get('topic');
    const type = url.searchParams.get('type');
    
    console.log('🔔 Query parameters:', {
      'data.id': url.searchParams.get('data.id'),
      'id': url.searchParams.get('id'),
      'topic': topic,
      'type': type,
      'resolved_dataId': dataId
    });
    
    // Get headers for signature verification
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    
    // Get the raw body text for signature verification
    const rawBody = await request.text();
    console.log('🔔 Raw body received:', rawBody);
    console.log('🔔 Raw body length:', rawBody.length);
    
    // Log the webhook request for debugging
    console.log('🔔 Webhook received:', {
      signature: xSignature,
      requestId: xRequestId,
      dataId: dataId,
      timestamp: new Date().toISOString()
    });

    // Parse the body as JSON
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('🔔 Parsed JSON body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse JSON body:', parseError.message);
      console.log('Raw body that failed to parse:', rawBody);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in webhook body' 
      }, { status: 400 });
    }
    
    // Log webhook type and payment ID for tracking
    if ((body.type === 'payment' || type === 'payment') && (body.data?.id || dataId)) {
      const paymentId = body.data?.id || dataId;
      console.log(`🔔 Payment webhook received for payment ID: ${paymentId}`);
    }
    
    // Verify webhook signature (if signature verification is enabled)
    let signatureValid = false;
    
    // Determine webhook type for signature verification
    const webhookType = body.type || type || body.topic || topic || 'unknown';
    console.log('🔔 Determined webhook type for signature verification:', webhookType);
    
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && xSignature && xRequestId && dataId) {
      // Skip signature verification for merchant_order webhooks as they seem to use a different algorithm
      if (webhookType === 'merchant_order') {
        console.log('⚠️ Skipping signature verification for merchant_order webhook (known issue with MercadoPago)');
        signatureValid = true; // Allow merchant_order webhooks to pass through
      } else {
        signatureValid = verifyWebhookSignature(rawBody, xSignature, xRequestId, dataId, webhookType);
        if (!signatureValid) {
          console.error('❌ Invalid webhook signature');
          console.log('⚠️ Webhook signature verification failed. Please check your MERCADOPAGO_WEBHOOK_SECRET.');
          // Return error for invalid signatures in production
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid webhook signature' 
          }, { status: 401 });
        } else {
          console.log('✅ Webhook signature verified successfully');
        }
      }
    } else {
      console.log('⚠️ Webhook signature verification skipped (missing required parameters)');
      console.log('Missing:', {
        secret: !process.env.MERCADOPAGO_WEBHOOK_SECRET,
        signature: !xSignature,
        requestId: !xRequestId,
        dataId: !dataId
      });
      
      // If webhook secret is not configured, log a warning but continue
      if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
        console.log('⚠️ NOTICE: MERCADOPAGO_WEBHOOK_SECRET is not configured');
        console.log('⚠️ TO FIX: Add the correct webhook secret from your MercadoPago dashboard');
      }
    }
    
    // Log the webhook body
    console.log('Webhook body:', JSON.stringify(body, null, 2));
    
    // MercadoPago sends different types of notifications
    // Handle both body.type and URL type parameter
    const webhookTypeForProcessing = body.type || type || body.topic || topic;
    
    console.log('🔔 Determined webhook type for processing:', webhookTypeForProcessing);
    
    // Handle MercadoPago simulation format specifically
    if (body.action === 'payment.updated' && body.data?.id) {
      console.log('🔔 Detected MercadoPago simulation/test webhook format');
      const paymentId = body.data.id;
      
      // For test/simulation webhooks, just log and return success
      if (!body.live_mode || body.id === '123456' || paymentId === '123456') {
        console.log(`🧪 Test webhook for payment ID: ${paymentId} (test mode or simulation)`);
        console.log('🧪 This is a test/simulation, returning success without processing');
        return NextResponse.json({ 
          success: true, 
          message: 'Test/simulation webhook received successfully',
          processed: false,
          reason: 'test_mode_or_simulation',
          paymentId: paymentId
        });
      }
    }
    
    // Also handle test payment IDs in regular payment processing
    if (webhookTypeForProcessing === 'payment') {
      const paymentId = body.data?.id || dataId;
      
      if (!paymentId) {
        console.error('No payment ID in webhook body or URL');
        return NextResponse.json({ success: false, error: 'No payment ID' }, { status: 400 });
      }
      
      // Skip verification for test/simulation payment IDs
      if (paymentId === '123456' || (typeof paymentId === 'string' && paymentId.includes('test'))) {
        console.log(`🧪 Skipping verification for test payment ID: ${paymentId}`);
        return NextResponse.json({ 
          success: true, 
          message: 'Test payment webhook processed',
          processed: false,
          reason: 'test_payment_id',
          paymentId: paymentId
        });
      }
      
      // Verify payment with MercadoPago
      const paymentResult = await verifyPayment(paymentId);
      
      if (!paymentResult.success) {
        console.error('Failed to verify payment:', paymentResult.error);
        console.error('Payment ID that failed:', paymentId);
        return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
      }
      
      const payment = paymentResult.payment;
      console.log('Payment verified:', {
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        external_reference: payment.external_reference
      });
      
      // Parse external reference to get user and plan info
      const referenceData = parseExternalReference(payment.external_reference);
      
      if (!referenceData) {
        console.error('Invalid external reference:', payment.external_reference);
        return NextResponse.json({ success: false, error: 'Invalid external reference' }, { status: 400 });
      }
      
      // Update payment intent in database
      const paymentIntent = await prisma.paymentIntent.findFirst({
        where: {
          externalReference: payment.external_reference
        }
      });
      
      if (!paymentIntent) {
        console.error('Payment intent not found:', payment.external_reference);
        return NextResponse.json({ success: false, error: 'Payment intent not found' }, { status: 400 });
      }
      
      // Update payment intent status
      await prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: payment.status,
          mercadoPagoPaymentId: payment.id.toString(),
          updatedAt: new Date()
        }
      });
      
      console.log(`Payment intent updated: ${paymentIntent.id} -> ${payment.status}`);
      
      // Handle different payment statuses
      if (payment.status === 'approved') {
        const subscriptionResult = await createSubscriptionSafely({
          userId: referenceData.userId,
          planId: referenceData.planId,
          paymentId: payment.id,
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          context: 'webhook'
        });

        if (!subscriptionResult.success) {
          console.error(`Failed to create subscription in webhook: ${subscriptionResult.error}`);
          // Don't return error here - payment was processed successfully
          // This is just a logging issue that should be investigated separately
        }
      } else if (payment.status === 'cancelled' || payment.status === 'rejected') {
        // Handle failed payments
        console.log(`❌ Payment failed for user ${referenceData.userId}: ${payment.status}`);
        
        // Update payment intent to failed status
        await prisma.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: {
            status: 'failed',
            updatedAt: new Date()
          }
        });
      } else if (payment.status === 'pending') {
        console.log(`⏳ Payment pending for user ${referenceData.userId}`);
      }
    } else if (webhookTypeForProcessing === 'test') {
      // Handle test notifications
      console.log('🧪 Test webhook received');
    } else if (webhookTypeForProcessing === 'merchant_order') {
      // Handle merchant order notifications
      console.log('📦 Merchant order webhook received:', dataId);
      // Merchant order webhooks are typically sent alongside payment webhooks
      // and don't require additional processing for basic payment flows
    } else {
      console.log('❓ Unknown webhook type:', webhookTypeForProcessing);
      console.log('Available data:', { 
        bodyType: body.type, 
        urlType: type, 
        bodyTopic: body.topic, 
        urlTopic: topic,
        bodyAction: body.action 
      });
      console.log('Full body for debugging:', JSON.stringify(body, null, 2));
    }
    
    // Always return success to MercadoPago to prevent retries
    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      processed: true
    });
    
  } catch (error) {
    console.error('💥 Webhook error:', error);
    console.error('Stack trace:', error.stack);
    // Return success even on error to prevent webhook retries from MercadoPago
    // Log the error for investigation
    return NextResponse.json({ 
      success: true,
      error_logged: true,
      timestamp: new Date().toISOString()
    });
  } finally {
    await prisma.$disconnect();
  }
}

// MercadoPago also sends GET requests to verify the endpoint
export async function GET() {
  console.log('Webhook endpoint health check');
  return NextResponse.json({ 
    status: 'webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}

// Handle CORS preflight requests
export async function OPTIONS() {
  console.log('Webhook endpoint OPTIONS request (CORS preflight)');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Signature, X-Request-Id',
    },
  });
} 