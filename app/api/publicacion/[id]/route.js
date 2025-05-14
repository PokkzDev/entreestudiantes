import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET /api/publicacion/[id] - Obtener una publicación específica
export async function GET(req, context) {
  try {
    // Extraer y esperar el parámetro id
    const { id } = await context.params;
    
    // Obtener la publicación
    const publicacion = await prisma.publicacion.findUnique({
      where: { id }
    });

    if (!publicacion) {
      return NextResponse.json({ 
        success: false, 
        error: "Publicación no encontrada" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      publicacion
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// PUT /api/publicacion/[id] - Actualizar una publicación
export async function PUT(req, context) {
  try {
    // Extraer y esperar el parámetro id
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
        error: "No tienes permiso para editar esta publicación" 
      }, { status: 403 });
    }

    // Procesar los datos de actualización
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
      // Si no hay precio válido, dejar como null
      if (isNaN(price)) price = null;
    } else {
      price = null; // Para servicios, siempre null
    }

    // Actualizar la publicación
    const publicacion = await prisma.publicacion.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
        price: price,
        contactMethod: data.contactMethod,
        contactInfo: data.contactInfo,
        images: Array.isArray(data.images) ? data.images.join(",") : data.images || "",
        status: data.status || "activo",
        location: data.location || "",
        tags: data.tags || "",
      }
    });

    return NextResponse.json({
      success: true,
      publicacion
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE /api/publicacion/[id] - Eliminar una publicación
export async function DELETE(req, context) {
  try {
    // Extraer y esperar el parámetro id
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
      where: { id },
      include: {
        author: {
          select: {
            username: true,
            email: true
          }
        }
      }
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
        error: "No tienes permiso para eliminar esta publicación" 
      }, { status: 403 });
    }

    // Obtener información de la petición HTTP
    const headers = req.headers;
    const ipAddress = headers.get('x-forwarded-for') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';

    // Registrar la publicación eliminada para fines legales
    await prisma.deletedPublicationLog.create({
      data: {
        publicationId: existingPublication.id,
        authorId: existingPublication.authorId,
        username: existingPublication.author.username,
        email: existingPublication.author.email,
        title: existingPublication.title,
        description: existingPublication.description,
        type: existingPublication.type,
        price: existingPublication.price,
        images: existingPublication.images,
        category: existingPublication.category,
        contactMethod: existingPublication.contactMethod,
        contactInfo: existingPublication.contactInfo,
        location: existingPublication.location || "",
        tags: existingPublication.tags,
        ipAddress,
        userAgent,
        reason: "Eliminación manual por usuario",
        deletedBy: "user",
        publicationCreatedAt: existingPublication.createdAt
      }
    });

    // Eliminar la publicación
    await prisma.publicacion.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Publicación eliminada correctamente"
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
