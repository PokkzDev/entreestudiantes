import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getEffectiveTier, canCreatePublicationFromTierData } from "@/lib/accountTiers";
import { getCurrentActiveSubscription } from "@/lib/dbUtils";

// GET /api/check-publication-limits - Check if user can create more publications
export async function GET(req) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No estás autenticado" 
      }, { status: 401 });
    }

    // Get user with basic information and publication count
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        accountTier: true,
        _count: {
          select: {
            publicaciones: true // Count ALL publications regardless of status
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no encontrado" 
      }, { status: 404 });
    }

    // Get current active subscription
    const currentSubscription = await getCurrentActiveSubscription(user.id);

    // Create user object compatible with getEffectiveTier function
    const userWithSubscription = {
      accountTier: user.accountTier,
      currentSubscription
    };

    // Get effective tier (considering subscription status)
    const effectiveTier = getEffectiveTier(userWithSubscription, currentSubscription);
    const totalPublicationCount = user._count.publicaciones; // All publications
    
    // Fetch tier data from database
    const tierData = await prisma.accountTier.findUnique({
      where: { tierKey: effectiveTier }
    });

    if (!tierData) {
      return NextResponse.json({ 
        success: false, 
        error: `Información del plan ${effectiveTier} no encontrada en la base de datos` 
      }, { status: 500 });
    }

    // Transform tier data to expected format
    const formattedTierData = {
      name: tierData.name,
      publicationLimit: tierData.publicationLimit,
      price: tierData.price,
      features: JSON.parse(tierData.features),
      icon: tierData.icon,
      color: tierData.color,
      bgColor: tierData.bgColor
    };
    
    // Check if user can create more publications (NEW LOGIC - counts all publications)
    const limitInfo = canCreatePublicationFromTierData(effectiveTier, totalPublicationCount, formattedTierData);
    
    // Determine if subscription is active
    const subscriptionActive = currentSubscription ? 
      (currentSubscription.status === 'active' && new Date() <= new Date(currentSubscription.endDate)) :
      (user.accountTier === 'free'); // Free tier is always "active"
    
    return NextResponse.json({
      success: true,
      canCreate: limitInfo.canCreate,
      currentTier: effectiveTier,
      tierName: formattedTierData.name,
      currentCount: totalPublicationCount,
      limit: limitInfo.limit,
      remaining: limitInfo.remaining,
      isUnlimited: limitInfo.isUnlimited,
      subscriptionActive,
      subscriptionEndDate: currentSubscription?.endDate || null,
      subscriptionId: currentSubscription?.id || null
    });

  } catch (error) {
    console.error("Error checking publication limits:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 