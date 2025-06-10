import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// POST /api/rating - Submit a rating for a user
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: "Debes iniciar sesión para calificar usuarios" 
      }, { status: 401 });
    }

    const { ratedUserId, rating, comment } = await req.json();

    // Validate input
    if (!ratedUserId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de usuario requerido" 
      }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        success: false, 
        error: "La calificación debe ser entre 1 y 5 estrellas" 
      }, { status: 400 });
    }

    // Prevent self-rating
    if (session.user.id === ratedUserId) {
      return NextResponse.json({ 
        success: false, 
        error: "No puedes calificarte a ti mismo" 
      }, { status: 400 });
    }

    // Check if rated user exists
    const ratedUser = await prisma.user.findUnique({
      where: { id: ratedUserId },
      select: { id: true, username: true }
    });

    if (!ratedUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no encontrado" 
      }, { status: 404 });
    }

    // Upsert rating (update if exists, create if not)
    const userRating = await prisma.userRating.upsert({
      where: {
        raterId_ratedId: {
          raterId: session.user.id,
          ratedId: ratedUserId
        }
      },
      update: {
        rating: parseInt(rating),
        comment: comment || null,
        updatedAt: new Date()
      },
      create: {
        raterId: session.user.id,
        ratedId: ratedUserId,
        rating: parseInt(rating),
        comment: comment || null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Calificación enviada exitosamente",
      rating: userRating
    });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 });
  }
}

// GET /api/rating?userId=xxx&raterId=xxx - Get specific rating or user's rating given by current user
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const raterId = searchParams.get('raterId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de usuario requerido" 
      }, { status: 400 });
    }

    let whereCondition = { ratedId: userId };
    
    // If raterId is provided, get specific rating
    if (raterId) {
      whereCondition.raterId = raterId;
    }

    const ratings = await prisma.userRating.findMany({
      where: whereCondition,
      include: {
        rater: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      ratings
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 });
  }
} 