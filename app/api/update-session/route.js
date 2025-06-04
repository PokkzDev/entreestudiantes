import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const body = await request.json();
    // Only allow updating certain fields
    const allowedFields = ["name", "username", "image", "nameChangeCount", "usernameChangeCount"];
    const updateData = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
    }
    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        nameChangeCount: true,
        usernameChangeCount: true
      }
    });
    // Trigger session update (NextAuth expects a 200 response for PATCH to /api/auth/session?update)
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
