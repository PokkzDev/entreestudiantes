import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET /api/busqueda?categoria=...&q=...&tipo=...&universidad=...&campus=...
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const q = searchParams.get("q");
  const tipo = searchParams.get("tipo"); // "producto", "servicio" o vacío
  const universidad = searchParams.get("universidad");
  const campus = searchParams.get("campus");

  const where = {
    status: "activo",
    hiddenByReports: false, // Exclude publications hidden due to reports
    // Filter out publications from banned, suspended, or inactive users
    author: {
      isBanned: false,
      isActive: true,
      OR: [
        { isSuspended: false },
        {
          AND: [
            { isSuspended: true },
            { suspensionEndsAt: { not: null } },
            { suspensionEndsAt: { lt: new Date() } }
          ]
        }
      ]
    },
    ...(tipo ? { type: tipo } : {}),
    ...(categoria ? { category: categoria } : {}),
    ...(universidad ? { university: universidad } : {}),
    ...(campus ? { campus: campus } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } },
          ],
        }
      : {}),
  };

  const publicaciones = await prisma.publicacion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          university: true,
          campus: true,
          isBanned: true,
          isSuspended: true,
          isActive: true,
          suspensionEndsAt: true
        }
      }
    }
  });

  // Extraer categorías únicas (only from active users)
  const categorias = await prisma.publicacion.findMany({
    where: { 
      status: "activo",
      author: {
        isBanned: false,
        isActive: true,
        OR: [
          { isSuspended: false },
          {
            AND: [
              { isSuspended: true },
              { suspensionEndsAt: { not: null } },
              { suspensionEndsAt: { lt: new Date() } }
            ]
          }
        ]
      }
    },
    select: { category: true },
    distinct: ["category"],
  });

  // Extraer tipos únicos (only from active users)
  const tipos = await prisma.publicacion.findMany({
    where: { 
      status: "activo",
      author: {
        isBanned: false,
        isActive: true,
        OR: [
          { isSuspended: false },
          {
            AND: [
              { isSuspended: true },
              { suspensionEndsAt: { not: null } },
              { suspensionEndsAt: { lt: new Date() } }
            ]
          }
        ]
      }
    },
    select: { type: true },
    distinct: ["type"],
  });

  // Extraer universidades únicas (only from active users)
  const universidades = await prisma.publicacion.findMany({
    where: { 
      status: "activo",
      university: { not: null },
      author: {
        isBanned: false,
        isActive: true,
        OR: [
          { isSuspended: false },
          {
            AND: [
              { isSuspended: true },
              { suspensionEndsAt: { not: null } },
              { suspensionEndsAt: { lt: new Date() } }
            ]
          }
        ]
      }
    },
    select: { university: true },
    distinct: ["university"],
  });

  // Extraer campus únicos (only from active users)
  const campuses = await prisma.publicacion.findMany({
    where: { 
      status: "activo",
      campus: { not: null },
      author: {
        isBanned: false,
        isActive: true,
        OR: [
          { isSuspended: false },
          {
            AND: [
              { isSuspended: true },
              { suspensionEndsAt: { not: null } },
              { suspensionEndsAt: { lt: new Date() } }
            ]
          }
        ]
      }
    },
    select: { campus: true },
    distinct: ["campus"],
  });

  // Obtener información del usuario si está autenticado
  let userUniversity = null;
  let userCampus = null;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { university: true, campus: true }
      });
      userUniversity = user?.university || null;
      userCampus = user?.campus || null;
    }
  } catch (error) {
    // Si hay error obteniendo la sesión, continuar sin datos de usuario
    console.log("Error getting user session:", error);
  }

  return NextResponse.json({ 
    publicaciones, 
    categorias: categorias.map(c => c.category), 
    tipos: tipos.map(t => t.type),
    universidades: universidades.map(u => u.university).filter(Boolean),
    campuses: campuses.map(c => c.campus).filter(Boolean),
    userUniversity,
    userCampus
  });
}
