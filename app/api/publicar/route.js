import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePostAuth } from "@/lib/authHelpers";
import { getEffectiveTier, canCreatePublication } from "@/lib/accountTiers";
import { getCurrentActiveSubscription } from "@/lib/dbUtils";

export async function POST(req) {
  try {
    // Check if user is authenticated and can post
    const authResult = await requirePostAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: authResult.status });
    }
    
    const { user } = authResult;

    // Get user's current university, campus, and basic account information
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        university: true,
        campus: true,
        accountTier: true,
        _count: {
          select: {
            publicaciones: {
              where: {
                status: "activo" // Only count active publications
              }
            }
          }
        }
      },
    });

    if (!userDetails) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no encontrado." 
      }, { status: 404 });
    }

    // Get current active subscription
    const currentSubscription = await getCurrentActiveSubscription(user.id);

    // Create user object compatible with getEffectiveTier function
    const userForTierCalculation = {
      accountTier: userDetails.accountTier,
      currentSubscription
    };

    // Check publication limits based on account tier
    const effectiveTier = getEffectiveTier(userForTierCalculation, currentSubscription);
    const currentPublicationCount = userDetails._count.publicaciones;
    const limitInfo = canCreatePublication(effectiveTier, currentPublicationCount);

    if (!limitInfo.canCreate) {
      return NextResponse.json({ 
        success: false, 
        error: `Has alcanzado el límite de publicaciones para tu plan ${effectiveTier === 'free' ? 'Gratuito' : effectiveTier}. ${limitInfo.limit ? `Límite: ${limitInfo.limit} publicaciones.` : ''} ${effectiveTier === 'free' ? 'Considera upgrading tu cuenta para crear más publicaciones.' : 'Tu suscripción puede haber expirado.'}`,
        limitReached: true,
        currentTier: effectiveTier,
        currentCount: currentPublicationCount,
        limit: limitInfo.limit
      }, { status: 403 });
    }
    
    const data = await req.json();
    let price = null;
    if (data.type === 'producto') {
      if (data.priceRange) {
        if (data.priceMin && data.priceMax) {
          price = parseFloat(data.priceMin);
        }
      } else if (data.priceMin) {
        price = parseFloat(data.priceMin);
      }
      if (isNaN(price)) price = null;
    } else if (data.type === 'servicio') {
      // Para servicios, guardar el precio base
      if (data.priceMin) {
        price = parseFloat(data.priceMin);
      }
      if (isNaN(price)) price = null;
    } else {
      price = null;
    }
    // Limitar a 4 imágenes para evitar exceder el límite del campo en la base de datos
    let imagesToStore = [];
    if (Array.isArray(data.images)) {
      if (data.images.length > 4) {
        return NextResponse.json({ 
          success: false, 
          error: "Solo se permiten un máximo de 4 imágenes por publicación." 
        }, { status: 400 });
      }
      imagesToStore = data.images.slice(0, 4);
    } else if (typeof data.images === 'string' && data.images) {
      const imageArray = data.images.split(',');
      if (imageArray.length > 4) {
        return NextResponse.json({ 
          success: false, 
          error: "Solo se permiten un máximo de 4 imágenes por publicación." 
        }, { status: 400 });
      }
      imagesToStore = imageArray.slice(0, 4);
    }
    
    const publicacion = await prisma.publicacion.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
        price: price, // Siempre null o número válido
        contactMethod: data.contactMethod,
        contactInfo: data.contactInfo,
        images: Array.isArray(imagesToStore) ? imagesToStore.join(",") : "",
        status: "activo",
        location: data.location || "",
        tags: data.tags || "",
        views: 0,
        featured: false,
        university: userDetails.university, // Grab user's current university
        campus: userDetails.campus, // Grab user's current campus
        authorId: user.id, // Use the authenticated user's ID
      },
    });
    return NextResponse.json({ success: true, publicacion });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
