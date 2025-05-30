import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Safely parse JSON with fallback
    let requestData = {};
    try {
      const text = await request.text();
      if (text && text.trim() !== '') {
        requestData = JSON.parse(text);
      }
    } catch (jsonError) {
      console.warn("Invalid JSON in request body, proceeding with empty data:", jsonError.message);
      // Continue with empty data instead of throwing error
    }

    const { reason } = requestData;

    // Get user data with subscription information
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        username: true,
        email: true,
        accountTier: true,
        subscriptionStatus: true,
        tierStartDate: true,
        tierEndDate: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { startDate: 'desc' },
          take: 1
        },
        nombre: true,
        apellidos: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Check if user has an active subscription to cancel
    if (user.accountTier === 'free') {
      return NextResponse.json(
        { success: false, error: "No tienes una suscripción activa para cancelar" },
        { status: 400 }
      );
    }

    if (user.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { success: false, error: "Tu suscripción ya está cancelada o inactiva" },
        { status: 400 }
      );
    }

    // Get request metadata for logging
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown';

    // Begin transaction to update user, subscription records, and create log
    await prisma.$transaction(async (tx) => {
      // Get the active subscription for logging
      const activeSubscription = user.subscriptions[0];

      // Update user to free tier
      await tx.user.update({
        where: { id: user.id },
        data: {
          accountTier: 'free',
          subscriptionStatus: 'cancelled',
          tierEndDate: new Date(), // End subscription immediately
          updatedAt: new Date()
        }
      });

      // Update all active subscriptions for this user to cancelled
      await tx.subscription.updateMany({
        where: {
          userId: user.id,
          status: 'active'
        },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason || 'Usuario canceló la suscripción',
          updatedAt: new Date()
        }
      });

      // Create cancellation log entry
      await tx.subscriptionCancellationLog.create({
        data: {
          userId: user.id,
          username: user.username,
          email: user.email,
          name: user.nombre && user.apellidos ? `${user.nombre} ${user.apellidos}` : user.nombre || user.apellidos || null,
          subscriptionId: activeSubscription?.id,
          planId: activeSubscription?.planId || user.accountTier,
          previousAccountTier: user.accountTier,
          reason: reason || 'No se proporcionó razón',
          ipAddress: ipAddress,
          userAgent: userAgent,
          subscriptionStartDate: activeSubscription?.startDate || user.tierStartDate,
          subscriptionEndDate: activeSubscription?.endDate || user.tierEndDate,
        }
      });
    });

    console.log(`Subscription cancelled for user ${user.id} (${user.email}). Reason: ${reason || 'No reason provided'}`);

    return NextResponse.json({
      success: true,
      message: "Suscripción cancelada exitosamente. Tu cuenta ha sido cambiada al plan gratuito."
    });

  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor al cancelar la suscripción" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 