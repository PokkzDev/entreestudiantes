import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getEffectiveTier, canCreatePublication, formatTierName } from "@/lib/accountTiers";
import { getCurrentActiveSubscription } from "@/lib/dbUtils";

// GET /api/mis-publicaciones - Obtener publicaciones del usuario autenticado
export async function GET(req) {
  try {
    // Verificar la sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No estás autenticado" 
      }, { status: 401 });
    }

    // Obtener todas las publicaciones del usuario junto con información básica de cuenta
    const userWithPublications = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        accountTier: true,
        publicaciones: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!userWithPublications) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no encontrado" 
      }, { status: 404 });
    }

    // Get current active subscription
    const currentSubscription = await getCurrentActiveSubscription(session.user.id);

    // Create user object compatible with getEffectiveTier function
    const userForTierCalculation = {
      accountTier: userWithPublications.accountTier,
      currentSubscription
    };

    // Calculate account tier information
    const effectiveTier = getEffectiveTier(userForTierCalculation, currentSubscription);
    const activePublicationsCount = userWithPublications.publicaciones.filter(p => p.status === 'activo').length;
    const limitInfo = canCreatePublication(effectiveTier, activePublicationsCount);

    // Determine if subscription is active
    const subscriptionActive = currentSubscription ? 
      (currentSubscription.status === 'active' && new Date() <= new Date(currentSubscription.endDate)) :
      (userWithPublications.accountTier === 'free'); // Free tier is always "active"

    return NextResponse.json({
      success: true,
      publicaciones: userWithPublications.publicaciones,
      accountInfo: {
        currentTier: effectiveTier,
        tierName: formatTierName(effectiveTier),
        canCreate: limitInfo.canCreate,
        currentCount: activePublicationsCount,
        limit: limitInfo.limit,
        remaining: limitInfo.remaining,
        isUnlimited: limitInfo.isUnlimited,
        subscriptionActive,
        subscriptionEndDate: currentSubscription?.endDate || null
      }
    });
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
