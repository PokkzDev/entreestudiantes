import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requirePostAuth } from "@/lib/authHelpers";
import { v2 as cloudinary } from "cloudinary";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/publicacion/[id] - Obtener una publicación específica
export async function GET(req, context) {
  try {
    // Extraer y esperar el parámetro id
    const { id } = await context.params;
    
    // Obtener la publicación con información del autor
    const publicacion = await prisma.publicacion.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            university: true,
            campus: true,
            createdAt: true,
            isBanned: true,
            isSuspended: true,
            isActive: true,
            suspensionEndsAt: true
          }
        }
      }
    });

    if (!publicacion) {
      return NextResponse.json({ 
        success: false, 
        error: "Publicación no encontrada" 
      }, { status: 404 });
    }

    // Hide publications that have been hidden due to reports
    if (publicacion.hiddenByReports) {
      return NextResponse.json({ 
        success: false, 
        error: "Esta publicación no está disponible" 
      }, { status: 404 });
    }

    // Check if the author is banned, inactive, or currently suspended
    const now = new Date();
    const isCurrentlySuspended = publicacion.author.isSuspended && 
      (!publicacion.author.suspensionEndsAt || now < new Date(publicacion.author.suspensionEndsAt));
    
    if (publicacion.author.isBanned || !publicacion.author.isActive || isCurrentlySuspended) {
      return NextResponse.json({ 
        success: false, 
        error: "Esta publicación no está disponible" 
      }, { status: 404 });
    }

    // Remove moderation fields from author object before returning
    const { isBanned, isSuspended, isActive, suspensionEndsAt, ...publicAuthor } = publicacion.author;
    const publicacionToReturn = {
      ...publicacion,
      author: publicAuthor
    };

    return NextResponse.json({
      success: true,
      publicacion: publicacionToReturn
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
    
    // Check if user is authenticated and can post
    const authResult = await requirePostAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: authResult.status });
    }
    
    const { user } = authResult;

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

    if (existingPublication.authorId !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No tienes permiso para editar esta publicación" 
      }, { status: 403 });
    }

    // Procesar los datos de actualización
    const data = await req.json();
    let price = null;
    
    if (data.price) {
      price = parseFloat(data.price);
      if (isNaN(price)) price = null;
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
        images: Array.isArray(imagesToStore) ? imagesToStore.join(",") : imagesToStore || "",
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
    
    // Check if user is authenticated
    const authResult = await requireAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: authResult.status });
    }
    
    const { user } = authResult;

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

    if (existingPublication.authorId !== user.id) {
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
        university: existingPublication.university,
        campus: existingPublication.campus,
        ipAddress,
        userAgent,
        reason: "Eliminación manual por usuario",
        deletedBy: "user",
        publicationCreatedAt: existingPublication.createdAt
      }
    });

    // Eliminar imágenes asociadas antes de eliminar la publicación
    if (existingPublication.images) {
      const imagesArr = existingPublication.images.split(',').map(img => img.trim()).filter(Boolean);
      const fs = require('fs').promises;
      const path = require('path');
      for (const imgUrl of imagesArr) {
        if (imgUrl.includes('res.cloudinary.com')) {
          // Extract public_id from Cloudinary URL robustly
          try {
            // Example: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/entreestudiantes/filename.jpg
            // We want: entreestudiantes/filename (without extension)
            const urlParts = imgUrl.split('/');
            const uploadIdx = urlParts.findIndex(p => p === 'upload');
            if (uploadIdx !== -1 && urlParts.length > uploadIdx + 1) {
              // Get everything after 'upload/' (may include version)
              let publicIdParts = urlParts.slice(uploadIdx + 1);
              // Remove version if present (starts with 'v' and is all digits)
              if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
                publicIdParts = publicIdParts.slice(1);
              }
              let publicIdWithExt = publicIdParts.join('/');
              // Remove extension
              const lastDot = publicIdWithExt.lastIndexOf('.');
              const publicId = lastDot !== -1 ? publicIdWithExt.substring(0, lastDot) : publicIdWithExt;
              if (publicId) {
                await cloudinary.uploader.destroy(publicId);
              }
            }
          } catch (e) {
            // Ignore Cloudinary errors
          }
        } else {
          let imgPath = imgUrl;
          // Only handle local images in /images/
          if (imgPath.startsWith('/images/')) {
            imgPath = path.join(process.cwd(), 'public', imgPath);
          } else if (!imgPath.startsWith('/') && !imgPath.startsWith('http')) {
            imgPath = path.join(process.cwd(), 'public', 'images', imgPath);
          } else {
            continue; // skip external or malformed URLs
          }
          try {
            await fs.unlink(imgPath);
          } catch (e) {
            // Ignore errors (file may not exist)
          }
        }
      }
    }

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
