"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verificar que la solicitud proviene del mismo usuario que quiere eliminar la cuenta
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la razón de eliminación enviada desde el frontend
    const data = await request.json().catch(() => ({}));
    const reason = data.reason || "Usuario solicitó eliminación de cuenta";

    // Obtener información del usuario antes de eliminarlo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { publicaciones: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    
    // Contar cuántas publicaciones tenía
    const publicationCount = user.publicaciones.length;

    // Obtener información de la petición HTTP
    const requestHeaders = request.headers;
    const ipAddress = requestHeaders.get('x-forwarded-for') || 'unknown';
    const userAgent = requestHeaders.get('user-agent') || 'unknown';

    // Registrar la eliminación de la cuenta
    await prisma.deletedAccountLog.create({
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        reason,
        ipAddress,
        userAgent,
        publicationCount,
        accountCreatedAt: user.createdAt,
      }
    });

    // Registrar cada publicación del usuario en la tabla de publicaciones eliminadas
    if (user.publicaciones.length > 0) {
      await Promise.all(user.publicaciones.map(async (publicacion) => {
        await prisma.deletedPublicationLog.create({
          data: {
            publicationId: publicacion.id,
            authorId: userId,
            username: user.username,
            email: user.email,
            title: publicacion.title,
            description: publicacion.description,
            type: publicacion.type,
            price: publicacion.price,
            images: publicacion.images,
            category: publicacion.category,
            contactMethod: publicacion.contactMethod,
            contactInfo: publicacion.contactInfo,
            location: publicacion.location,
            tags: publicacion.tags,
            ipAddress,
            userAgent,
            reason: "Eliminación de cuenta",
            deletedBy: "account-deletion",
            publicationCreatedAt: publicacion.createdAt
          }
        });
      }));
    }

    // Delete user's profile image from Cloudinary if it exists
    if (user.image) {
      try {
        const { v2: cloudinary } = await import("cloudinary");
        
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.extension
        const urlParts = user.image.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          const fileWithExtension = urlParts[urlParts.length - 1];
          const publicId = fileWithExtension.split('.')[0];
          const folder = urlParts[urlParts.length - 2];
          const fullPublicId = folder && folder !== 'upload' ? `${folder}/${publicId}` : publicId;
          
          await cloudinary.uploader.destroy(fullPublicId);
          console.log("User profile image deleted from Cloudinary:", fullPublicId);
        }
      } catch (deleteError) {
        console.error("Error deleting user image from Cloudinary:", deleteError);
        // Continue with account deletion even if image deletion fails
      }
    }

    // Delete user's publication images from Cloudinary
    if (user.publicaciones.length > 0) {
      try {
        const { v2: cloudinary } = await import("cloudinary");
        
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        for (const publicacion of user.publicaciones) {
          if (publicacion.images && Array.isArray(publicacion.images) && publicacion.images.length > 0) {
            for (const imageUrl of publicacion.images) {
              try {
                // Only process if imageUrl is a string and looks like a Cloudinary URL
                if (typeof imageUrl === 'string' && imageUrl.includes('cloudinary.com')) {
                  const urlParts = imageUrl.split('/');
                  const uploadIndex = urlParts.findIndex(part => part === 'upload');
                  if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                    const fileWithExtension = urlParts[urlParts.length - 1];
                    const publicId = fileWithExtension.split('.')[0];
                    const folder = urlParts[urlParts.length - 2];
                    const fullPublicId = folder && folder !== 'upload' ? `${folder}/${publicId}` : publicId;
                    
                    await cloudinary.uploader.destroy(fullPublicId);
                    console.log("Publication image deleted from Cloudinary:", fullPublicId);
                  }
                }
              } catch (imageDeleteError) {
                console.error("Error deleting publication image:", imageDeleteError);
                // Continue with next image
              }
            }
          }
        }
      } catch (cloudinaryError) {
        console.error("Error setting up Cloudinary for publication images:", cloudinaryError);
        // Continue with account deletion
      }
    }

    // Eliminar primero los registros relacionados para mantener la integridad referencial
    // Eliminar publicaciones del usuario
    await prisma.publicacion.deleteMany({
      where: { authorId: userId },
    });

    // Eliminar al usuario
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Cuenta eliminada exitosamente" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error al eliminar la cuenta:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cuenta. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
