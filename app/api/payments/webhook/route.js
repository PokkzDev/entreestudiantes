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
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    
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
    if (body.type === 'payment' && body.data?.id) {
      console.log(`🔔 Payment webhook received for payment ID: ${body.data.id}`);
    }
    
    // Verify webhook signature (if signature verification is enabled)
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && xSignature && xRequestId && dataId) {
      const isValidSignature = verifyWebhookSignature(rawBody, xSignature, xRequestId, dataId);
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Webhook signature verified successfully');
    } else {
      console.log('⚠️ Webhook signature verification skipped (missing required parameters)');
    }
    
    // Log the webhook body
    console.log('Webhook body:', JSON.stringify(body, null, 2));
    
    // MercadoPago sends different types of notifications
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      if (!paymentId) {
        console.error('No payment ID in webhook body');
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
    } else if (body.type === 'test') {
      // Handle test notifications
      console.log('Test webhook received');
    } else {
      console.log('Unknown webhook type:', body.type);
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