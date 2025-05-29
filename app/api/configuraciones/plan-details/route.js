import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get user with subscription and publication data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        accountTier: true,
        subscriptionStatus: true,
        tierStartDate: true,
        tierEndDate: true,
        publicaciones: {
          where: {
            status: "activo" // Only count active publications
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Get payment history (subscriptions) - handle the unique constraint issue
    const paymentHistory = await prisma.subscription.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        planId: true,
        status: true,
        startDate: true,
        endDate: true,
        amount: true,
        currency: true,
        paymentId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to last 10 payments
    });

    // Get current active subscription details if not free tier
    let currentSubscription = null;
    if (user.accountTier !== 'free') {
      currentSubscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          planId: true,
          status: true,
          startDate: true,
          endDate: true,
          amount: true,
          currency: true,
          paymentId: true,
          autoRenew: true
        }
      });
    }

    // Calculate publication count
    const publicationCount = user.publicaciones.length;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountTier: user.accountTier,
        subscriptionStatus: user.subscriptionStatus,
        tierStartDate: user.tierStartDate,
        tierEndDate: user.tierEndDate
      },
      publicationCount,
      paymentHistory: paymentHistory.map(payment => ({
        id: payment.id,
        planId: payment.planId,
        status: payment.status,
        startDate: payment.startDate,
        endDate: payment.endDate,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        paymentId: payment.paymentId,
        createdAt: payment.createdAt
      })),
      currentSubscription: currentSubscription ? {
        ...currentSubscription,
        amount: parseFloat(currentSubscription.amount)
      } : null
    });

  } catch (error) {
    console.error("Error fetching plan details:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 