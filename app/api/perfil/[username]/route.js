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
        image: true,
        university: true,
        campus: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no encontrado" 
      }, { status: 404 });
    }

    // Obtener las publicaciones activas del usuario
    const publicaciones = await prisma.publicacion.findMany({
      where: { 
        authorId: user.id,
        status: "activo"
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

    return NextResponse.json({
      success: true,
      user,
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