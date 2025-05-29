import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createSubscriptionPreference } from '@/lib/mercadopago';
import { ACCOUNT_TIERS } from '@/lib/accountTiers';
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

    const { planId } = await request.json();

    // Validate plan ID
    if (!ACCOUNT_TIERS[planId]) {
      return NextResponse.json(
        { success: false, error: 'Plan no válido' },
        { status: 400 }
      );
    }

    // Don't allow payment for free plan
    if (planId === 'free') {
      return NextResponse.json(
        { success: false, error: 'El plan gratuito no requiere pago' },
        { status: 400 }
      );
    }

    // Get user information from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        accountTier: true,
        rut: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Check if user is already on the same plan or higher
    const tierOrder = { free: 0, basic: 1, premium: 2, elite: 3 };
    const currentTierLevel = tierOrder[user.accountTier] || 0;
    const targetTierLevel = tierOrder[planId];

    if (currentTierLevel >= targetTierLevel) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes este plan o uno superior' },
        { status: 400 }
      );
    }

    const planData = {
      id: planId,
      name: ACCOUNT_TIERS[planId].name,
      price: ACCOUNT_TIERS[planId].price
    };

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      rut: user.rut
    };

    // Create MercadoPago preference
    const preferenceResult = await createSubscriptionPreference(planData, userData);

    if (!preferenceResult.success) {
      return NextResponse.json(
        { success: false, error: 'Error creando preferencia de pago' },
        { status: 500 }
      );
    }

    // Save payment intent in database for tracking
    await prisma.paymentIntent.create({
      data: {
        userId: user.id,
        planId: planId,
        amount: planData.price,
        currency: 'CLP',
        mercadoPagoPreferenceId: preferenceResult.preference.id,
        externalReference: preferenceResult.preference.external_reference,
        status: 'pending',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      preference: {
        id: preferenceResult.preference.id,
        init_point: preferenceResult.init_point,
        sandbox_init_point: preferenceResult.sandbox_init_point
      }
    });

  } catch (error) {
    console.error('Error creating payment preference:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 