import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { verifyPayment, parseExternalReference } from '@/lib/mercadopago';
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
      console.log(`⚠️  Subscription already exists for payment ${payment.id}, returning existing subscription info`);
      return NextResponse.json({
        success: true,
        payment: {
          status: payment.status,
          amount: payment.transaction_amount,
          currency: payment.currency_id
        },
        subscriptionUpdated: true,
        message: 'Payment already processed'
      });
    }

    let subscriptionUpdated = false;

    // If payment is approved, update user's subscription
    if (payment.status === 'approved') {
      console.log(`Payment approved, updating subscription for user ${referenceData.userId}`);
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Add 1 month
      
      await prisma.user.update({
        where: { id: referenceData.userId },
        data: {
          accountTier: referenceData.planId,
          subscriptionStatus: 'active',
          tierStartDate: new Date(),
          tierEndDate: endDate,
          updatedAt: new Date()
        }
      });
      
      // Create or update subscription record
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
          startDate: new Date(),
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
      
      subscriptionUpdated = true;
      console.log(`Subscription updated successfully for user ${referenceData.userId}`);
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