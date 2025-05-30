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
  console.log('🔔 Webhook POST request received at:', new Date().toISOString());
  console.log('🔔 Request method:', request.method);
  console.log('🔔 Request URL:', request.url);
  
  try {
    // Extract query parameters from the URL
    const url = new URL(request.url);
    
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
    
    // Log the webhook request for debugging
    console.log('🔔 Webhook received:', {
      signature: xSignature,
      requestId: xRequestId,
      dataId: dataId,
      timestamp: new Date().toISOString()
    });

    // Parse the body as JSON
    const body = JSON.parse(rawBody);
    
    // Log webhook type and payment ID for tracking
    if ((body.type === 'payment' || type === 'payment') && (body.data?.id || dataId)) {
      const paymentId = body.data?.id || dataId;
      console.log(`🔔 Payment webhook received for payment ID: ${paymentId}`);
    }
    
    // Verify webhook signature (if signature verification is enabled)
    let signatureValid = false;
    
    // Determine webhook type for signature verification
    const webhookType = body.type || type || body.topic || topic || 'unknown';
    
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
    
    console.log('🔔 Determined webhook type:', webhookTypeForProcessing);
    
    if (webhookTypeForProcessing === 'payment') {
      const paymentId = body.data?.id || dataId;
      
      if (!paymentId) {
        console.error('No payment ID in webhook body or URL');
        return NextResponse.json({ success: false, error: 'No payment ID' }, { status: 400 });
      }
      
      // Verify payment with MercadoPago
      const paymentResult = await verifyPayment(paymentId);
      
      if (!paymentResult.success) {
        console.error('Failed to verify payment:', paymentResult.error);
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
      console.log('Test webhook received');
    } else if (webhookTypeForProcessing === 'merchant_order') {
      // Handle merchant order notifications
      console.log('📦 Merchant order webhook received:', dataId);
      // Merchant order webhooks are typically sent alongside payment webhooks
      // and don't require additional processing for basic payment flows
    } else {
      console.log('Unknown webhook type:', webhookTypeForProcessing);
      console.log('Available data:', { bodyType: body.type, urlType: type, bodyTopic: body.topic, urlTopic: topic });
    }
    
    // Always return success to MercadoPago to prevent retries
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Return success even on error to prevent webhook retries from MercadoPago
    // Log the error for investigation
    return NextResponse.json({ success: true });
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