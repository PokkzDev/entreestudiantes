import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// DELETE /api/favorites/[publicacionId] - Remove a favorite
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { publicacionId } = await params;

    if (!publicacionId) {
      return NextResponse.json({ error: 'ID de publicación requerido' }, { status: 400 });
    }

    // Check if favorite exists
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_publicacionId: {
          userId: session.user.id,
          publicacionId: publicacionId
        }
      }
    });

    if (!existingFavorite) {
      return NextResponse.json({ error: 'No está en favoritos' }, { status: 404 });
    }

    // Delete favorite
    await prisma.favorite.delete({
      where: {
        userId_publicacionId: {
          userId: session.user.id,
          publicacionId: publicacionId
        }
      }
    });

    return NextResponse.json({ message: 'Eliminado de favoritos' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET /api/favorites/[publicacionId] - Check if publication is favorited
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorited: false });
    }

    const { publicacionId } = await params;

    if (!publicacionId) {
      return NextResponse.json({ error: 'ID de publicación requerido' }, { status: 400 });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_publicacionId: {
          userId: session.user.id,
          publicacionId: publicacionId
        }
      }
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json({ isFavorited: false });
  }
} 