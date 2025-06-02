import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getEffectiveTier } from "@/lib/accountTiers";
import { getCurrentActiveSubscription } from "@/lib/dbUtils";

// PATCH /api/publicacion/[id]/toggle-status - Cambiar el estado de una publicación (activo/inactivo)
export async function PATCH(request, context) {
  try {
    // Desestructurar y esperar los parámetros
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    // Verificar que el usuario esté autenticado
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No estás autenticado" 
      }, { status: 401 });
    }

    // Verificar si la publicación existe y pertenece al usuario
    const existingPublication = await prisma.publicacion.findUnique({
      where: { id }
    });

    if (!existingPublication) {
      return NextResponse.json({ 
        success: false, 
        error: "Publicación no encontrada" 
      }, { status: 404 });
    }

    if (existingPublication.authorId !== session.user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No tienes permiso para modificar esta publicación" 
      }, { status: 403 });
    }

    // Get user account information to check tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        accountTier: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no encontrado" 
      }, { status: 404 });
    }

    // Get current active subscription
    const currentSubscription = await getCurrentActiveSubscription(session.user.id);

    // Create user object compatible with getEffectiveTier function
    const userForTierCalculation = {
      accountTier: user.accountTier,
      currentSubscription
    };

    // Get effective tier
    const effectiveTier = getEffectiveTier(userForTierCalculation, currentSubscription);

    // Prevent free users from toggling publication status
    if (effectiveTier === 'free') {
      return NextResponse.json({ 
        success: false, 
        error: "Los usuarios del plan Gratuito no pueden pausar/activar publicaciones. Para crear una nueva publicación, debes eliminar una existente o actualizar tu plan.",
        restrictedFeature: true,
        currentTier: effectiveTier
      }, { status: 403 });
    }

    // Cambiar el estado: si es "activo" pasa a "inactivo" y viceversa
    const newStatus = existingPublication.status === "activo" ? "inactivo" : "activo";
    
    // Actualizar el estado de la publicación
    const publicacion = await prisma.publicacion.update({
      where: { id },
      data: {
        status: newStatus
      }
    });

    return NextResponse.json({
      success: true,
      publicacion,
      message: `La publicación ha sido ${newStatus === "activo" ? "activada" : "pausada"} correctamente`
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
