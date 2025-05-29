import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { verifyPayment, parseExternalReference } from '@/lib/mercadopago';
import { createSubscriptionSafely } from '@/lib/dbUtils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID requerido' },
        { status: 400 }
      );
    }

    console.log(`Starting payment verification for user ${session.user.id}, paymentId: ${paymentId}`);

    // Verify payment with MercadoPago
    const paymentResult = await verifyPayment(paymentId);
    
    if (!paymentResult.success) {
      console.error(`Payment verification failed for paymentId ${paymentId}: ${paymentResult.error}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error verificando el pago',
          details: paymentResult.error // Include detailed error for debugging
        },
        { status: 400 }
      );
    }

    const payment = paymentResult.payment;
    console.log(`Payment verification successful. Payment status: ${payment.status}, external_reference: ${payment.external_reference}`);
    
    // Parse external reference to get user and plan info
    const referenceData = parseExternalReference(payment.external_reference);
    
    if (!referenceData) {
      console.error(`Invalid external reference: ${payment.external_reference}`);
      return NextResponse.json(
        { success: false, error: 'Referencia externa inválida' },
        { status: 400 }
      );
    }

    // Verify that the payment belongs to the current user
    if (referenceData.userId !== session.user.id) {
      console.error(`Payment ${paymentId} belongs to user ${referenceData.userId}, but current user is ${session.user.id}`);
      return NextResponse.json(
        { success: false, error: 'Pago no pertenece al usuario actual' },
        { status: 403 }
      );
    }

    let subscriptionUpdated = false;

    // If payment is approved, update user's subscription
    if (payment.status === 'approved') {
      console.log(`Payment approved, updating subscription for user ${referenceData.userId}`);
      
      const subscriptionResult = await createSubscriptionSafely({
        userId: referenceData.userId,
        planId: referenceData.planId,
        paymentId: payment.id,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        context: 'api'
      });

      if (subscriptionResult.success) {
        subscriptionUpdated = true;
        if (subscriptionResult.alreadyExists) {
          console.log(`Payment ${payment.id} already processed, returning existing subscription info`);
          return NextResponse.json({
            success: true,
            payment: {
              status: payment.status,
              amount: payment.transaction_amount,
              currency: payment.currency_id
            },
            subscriptionUpdated: true,
            message: subscriptionResult.message
          });
        }
      } else {
        console.error(`Failed to create subscription: ${subscriptionResult.error}`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error creando la suscripción',
            details: subscriptionResult.message
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        status: payment.status,
        amount: payment.transaction_amount,
        currency: payment.currency_id
      },
      subscriptionUpdated
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      // Unique constraint violation - likely a race condition with webhook
      console.log(`⚠️  Subscription creation race condition detected for payment ${error.meta?.target || 'unknown'}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'El pago ya ha sido procesado',
          details: 'This payment has already been processed by another request'
        },
        { status: 409 } // Conflict status code
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message // Include error details for debugging
      },
      { status: 500 }
    );
  }
} 