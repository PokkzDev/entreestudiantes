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

    // Verify payment with MercadoPago
    const paymentResult = await verifyPayment(paymentId);
    
    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: 'Error verificando el pago' },
        { status: 400 }
      );
    }

    const payment = paymentResult.payment;
    
    // Parse external reference to get user and plan info
    const referenceData = parseExternalReference(payment.external_reference);
    
    if (!referenceData) {
      return NextResponse.json(
        { success: false, error: 'Referencia externa inválida' },
        { status: 400 }
      );
    }

    // Verify that the payment belongs to the current user
    if (referenceData.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Pago no pertenece al usuario actual' },
        { status: 403 }
      );
    }

    let subscriptionUpdated = false;

    // If payment is approved, update user's subscription
    if (payment.status === 'approved') {
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
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 