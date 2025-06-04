import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/favorites - Get user's favorites
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        publicacion: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/favorites - Add a favorite
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { publicacionId } = await request.json();

    if (!publicacionId) {
      return NextResponse.json({ error: 'ID de publicación requerido' }, { status: 400 });
    }

    // Check if publication exists
    const publicacion = await prisma.publicacion.findUnique({
      where: { id: publicacionId }
    });

    if (!publicacion) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_publicacionId: {
          userId: session.user.id,
          publicacionId: publicacionId
        }
      }
    });

    if (existingFavorite) {
      return NextResponse.json({ error: 'Ya está en favoritos' }, { status: 400 });
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        publicacionId: publicacionId
      }
    });

    return NextResponse.json({ favorite, message: 'Agregado a favoritos' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 