import { NextResponse } from 'next/server';
import { verifyPayment, parseExternalReference, verifyWebhookSignature } from '@/lib/mercadopago';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Get headers for signature verification
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    
    // Log the webhook request for debugging
    console.log('🔔 Webhook received:', {
      signature: xSignature,
      requestId: xRequestId,
      timestamp: new Date().toISOString()
    });

    const body = await request.json();
    
    // Log webhook type and payment ID for tracking
    if (body.type === 'payment' && body.data?.id) {
      console.log(`🔔 Payment webhook received for payment ID: ${body.data.id}`);
    }
    
    // Verify webhook signature (if signature verification is enabled)
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && xSignature && xRequestId) {
      const isValidSignature = verifyWebhookSignature(request, xSignature, xRequestId);
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
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
      
      // Check if subscription already exists for this payment to prevent duplicate processing
      const existingSubscription = await prisma.subscription.findUnique({
        where: {
          userId_paymentId: {
            userId: referenceData.userId,
            paymentId: payment.id.toString()
          }
        }
      });
      
      if (existingSubscription) {
        console.log(`⚠️  Subscription already exists for payment ${payment.id}, skipping duplicate processing`);
        return NextResponse.json({ success: true, message: 'Payment already processed' });
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
        try {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(startDate.getDate() + 30); // Add exactly 30 days
          
          // Update user's subscription
          await prisma.user.update({
            where: { id: referenceData.userId },
            data: {
              accountTier: referenceData.planId,
              subscriptionStatus: 'active',
              tierStartDate: startDate,
              tierEndDate: endDate,
              updatedAt: new Date()
            }
          });
          
          // Create or update subscription record - use upsert to prevent duplicates
          await prisma.subscription.upsert({
            where: {
              userId_paymentId: {
                userId: referenceData.userId,
                paymentId: payment.id.toString()
              }
            },
            create: {
              userId: referenceData.userId,
              planId: referenceData.planId,
              status: 'active',
              startDate: startDate,
              endDate: endDate,
              amount: payment.transaction_amount,
              currency: payment.currency_id,
              paymentId: payment.id.toString(),
              createdAt: new Date()
            },
            update: {
              status: 'active',
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ Subscription activated for user ${referenceData.userId} to plan ${referenceData.planId} (30 days: ${startDate.toISOString()} - ${endDate.toISOString()})`);
        } catch (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
          // Don't return error here - payment was processed, subscription update failed
          // This should be handled separately
          
          // Check if it's a unique constraint error (race condition)
          if (subscriptionError.code === 'P2002') {
            console.log(`⚠️  Subscription creation race condition detected for payment ${payment.id}, but payment was processed successfully`);
          } else {
            // Log other types of errors for investigation
            console.error(`❌ Unexpected error creating subscription for payment ${payment.id}:`, subscriptionError);
          }
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