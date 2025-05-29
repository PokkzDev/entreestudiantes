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

    const { reason } = await request.json();

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        accountTier: true,
        subscriptionStatus: true
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

    // Begin transaction to update user and subscription records
    await prisma.$transaction(async (tx) => {
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
    });

    console.log(`Subscription cancelled for user ${user.id}. Reason: ${reason || 'No reason provided'}`);

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