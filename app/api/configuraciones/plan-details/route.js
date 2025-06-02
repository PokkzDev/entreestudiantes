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

    // Get user with publication data only
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        accountTier: true,
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

    // Get current active subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
        endDate: {
          gte: new Date() // Must not be expired
        }
      },
      orderBy: {
        endDate: 'desc' // Get the latest expiring active subscription
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
        autoRenew: true,
        createdAt: true
      }
    });

    // Get unified payment history combining PaymentLog and Subscription data
    // This provides complete payment information with subscription context
    const unifiedPaymentHistory = await prisma.paymentLog.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        planId: true,
        status: true,
        paymentDate: true,
        amount: true,
        currency: true,
        flowOrder: true,
        commerceOrder: true,
        flowToken: true,
        createdAt: true
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: 10 // Limit to last 10 payments
    });

    // For each payment, try to find the corresponding subscription for additional context
    const enrichedPaymentHistory = await Promise.all(
      unifiedPaymentHistory.map(async (payment) => {
        // Find subscription that matches this payment
        const relatedSubscription = await prisma.subscription.findFirst({
          where: {
            paymentId: payment.flowOrder || payment.commerceOrder,
            userId: user.id
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            cancelledAt: true,
            cancelReason: true
          }
        });

        return {
          // Payment information (primary)
          id: payment.id,
          planId: payment.planId,
          status: payment.status,
          paymentDate: payment.paymentDate,
          amount: payment.amount, // Keep as integer (cents) for now, convert in frontend
          currency: payment.currency,
          paymentId: payment.flowOrder || payment.commerceOrder,
          flowToken: payment.flowToken,
          createdAt: payment.createdAt,
          // Subscription context (secondary)
          subscription: relatedSubscription ? {
            id: relatedSubscription.id,
            startDate: relatedSubscription.startDate,
            endDate: relatedSubscription.endDate,
            subscriptionStatus: relatedSubscription.status,
            cancelledAt: relatedSubscription.cancelledAt,
            cancelReason: relatedSubscription.cancelReason,
            isExpired: new Date() > new Date(relatedSubscription.endDate)
          } : null
        };
      })
    );

    // Calculate publication count
    const publicationCount = user.publicaciones.length;

    // Determine effective account tier based on active subscription
    const effectiveAccountTier = currentSubscription ? currentSubscription.planId : 'free';

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.username,
        accountTier: user.accountTier, // Original tier for reference
        effectiveAccountTier: effectiveAccountTier, // Current effective tier
        subscriptionStatus: currentSubscription ? 'active' : 'inactive'
      },
      publicationCount,
      currentSubscription: currentSubscription ? {
        id: currentSubscription.id,
        planId: currentSubscription.planId,
        status: currentSubscription.status,
        startDate: currentSubscription.startDate,
        endDate: currentSubscription.endDate,
        amount: currentSubscription.amount, // Amount is already in CLP, not cents
        currency: currentSubscription.currency,
        paymentId: currentSubscription.paymentId,
        autoRenew: currentSubscription.autoRenew,
        isExpired: new Date() > new Date(currentSubscription.endDate)
      } : null,
      paymentHistory: enrichedPaymentHistory
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