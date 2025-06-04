import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/perfil/[username] - Obtener perfil de usuario y sus publicaciones
export async function GET(req, context) {
  try {
    // Extraer y esperar el parámetro username
    const { username } = await context.params;
    
    // Buscar el usuario por username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        university: true,
        campus: true,
        createdAt: true,
        isBanned: true,
        isSuspended: true,
        isActive: true,
        suspensionEndsAt: true,
        _count: {
          select: {
            publicaciones: {
              where: {
                status: "activo"
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

    // Check if user is banned, inactive, or currently suspended
    const now = new Date();
    const isCurrentlySuspended = user.isSuspended && (!user.suspensionEndsAt || now < new Date(user.suspensionEndsAt));
    
    if (user.isBanned || !user.isActive || isCurrentlySuspended) {
      return NextResponse.json({ 
        success: false, 
        error: "Este perfil no está disponible" 
      }, { status: 404 });
    }

    // Obtener las publicaciones activas del usuario
    const publicaciones = await prisma.publicacion.findMany({
      where: { 
        authorId: user.id,
        status: "activo",
        hiddenByReports: false
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        price: true,
        images: true,
        category: true,
        createdAt: true
      }
    });

    // Remove moderation fields from user object before returning
    const { isBanned, isSuspended, isActive, suspensionEndsAt, ...publicUser } = user;

    return NextResponse.json({
      success: true,
      user: publicUser,
      publicaciones
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 