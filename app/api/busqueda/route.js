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
  });

  // Extraer categorías únicas
  const categorias = await prisma.publicacion.findMany({
    where: { status: "activo" },
    select: { category: true },
    distinct: ["category"],
  });

  // Extraer tipos únicos
  const tipos = await prisma.publicacion.findMany({
    where: { status: "activo" },
    select: { type: true },
    distinct: ["type"],
  });

  // Extraer universidades únicas
  const universidades = await prisma.publicacion.findMany({
    where: { 
      status: "activo",
      university: { not: null }
    },
    select: { university: true },
    distinct: ["university"],
  });

  // Extraer campus únicos
  const campuses = await prisma.publicacion.findMany({
    where: { 
      status: "activo",
      campus: { not: null }
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
