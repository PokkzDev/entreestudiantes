import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/busqueda?categoria=...&q=...&tipo=...
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const q = searchParams.get("q");
  const tipo = searchParams.get("tipo"); // "producto", "servicio" o vacío

  const where = {
    status: "activo",
    ...(tipo ? { type: tipo } : {}),
    ...(categoria ? { category: categoria } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tags: { contains: q, mode: "insensitive" } },
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

  return NextResponse.json({ publicaciones, categorias: categorias.map(c => c.category), tipos: tipos.map(t => t.type) });
}
