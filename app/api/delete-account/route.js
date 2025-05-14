"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verificar que la solicitud proviene del mismo usuario que quiere eliminar la cuenta
    if (!userId) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la razón de eliminación enviada desde el frontend
    const data = await request.json().catch(() => ({}));
    const reason = data.reason || "";

    // Obtener información del usuario antes de eliminarlo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { publicaciones: true }
    });

    if (!user) {
      return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
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

    // Eliminar primero los registros relacionados para mantener la integridad referencial
    // Eliminar publicaciones del usuario
    await prisma.publicacion.deleteMany({
      where: { authorId: userId },
    });

    // Eliminar al usuario
    await prisma.user.delete({
      where: { id: userId },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar la cuenta:", error);
    return Response.json(
      { error: "Error al eliminar la cuenta. Inténtalo de nuevo." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
