import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getEffectiveTier, canCreatePublication, formatTierName } from "@/lib/accountTiers";

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

    // Get user with tier information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        accountTier: true,
        tierStartDate: true,
        tierEndDate: true,
        subscriptionStatus: true,
        _count: {
          select: {
            publicaciones: {
              where: {
                status: "activo" // Only count active publications
              }
            }
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

    // Get effective tier (considering subscription status)
    const effectiveTier = getEffectiveTier(user);
    const currentPublicationCount = user._count.publicaciones;
    
    // Check if user can create more publications
    const limitInfo = canCreatePublication(effectiveTier, currentPublicationCount);
    
    return NextResponse.json({
      success: true,
      canCreate: limitInfo.canCreate,
      currentTier: effectiveTier,
      tierName: formatTierName(effectiveTier),
      currentCount: currentPublicationCount,
      limit: limitInfo.limit,
      remaining: limitInfo.remaining,
      isUnlimited: limitInfo.isUnlimited,
      subscriptionActive: user.accountTier === 'free' || user.subscriptionStatus === 'active'
    });

  } catch (error) {
    console.error("Error checking publication limits:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 