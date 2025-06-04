import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { validateRut } from "@/utils/rutValidation";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, image, rut, bio } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
    }

    if (!username || username.trim().length < 4) {
      return NextResponse.json({ error: "El nombre de usuario debe tener al menos 4 caracteres" }, { status: 400 });
    }

    // Validate bio length if provided
    if (bio && bio.trim().length > 500) {
      return NextResponse.json({ 
        error: "La biografía no puede exceder los 500 caracteres" 
      }, { status: 400 });
    }

    // Validate RUT format if provided
    if (rut && rut.trim()) {
      if (!validateRut(rut.trim())) {
        return NextResponse.json({ 
          error: "El RUT ingresado no es válido. Por favor verifica el dígito verificador." 
        }, { status: 400 });
      }
    }

    // Check if username is already taken by another user
    if (username !== session.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: username.trim() }
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 400 });
      }
    }

    // Check if RUT is already taken by another user
    if (rut && rut.trim()) {
      const existingUserWithRut = await prisma.user.findUnique({
        where: { rut: rut.trim() }
      });

      if (existingUserWithRut && existingUserWithRut.id !== session.user.id) {
        return NextResponse.json({ error: "El RUT ya está registrado por otro usuario" }, { status: 400 });
      }
    }

    // Get current user data to check for changes
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, username: true, nameChangeCount: true, usernameChangeCount: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Check if name is being changed and validate change limit
    const nameChanged = currentUser.name !== name.trim();
    if (nameChanged && currentUser.nameChangeCount >= 3) {
      return NextResponse.json({ 
        error: "Has alcanzado el límite máximo de 3 cambios de nombre" 
      }, { status: 400 });
    }

    // Check if username is being changed and validate change limit
    const usernameChanged = currentUser.username !== username.trim();
    if (usernameChanged && currentUser.usernameChangeCount >= 3) {
      return NextResponse.json({ 
        error: "Has alcanzado el límite máximo de 3 cambios de nombre de usuario" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      username: username.trim()
    };

    // Add bio if provided
    if (bio !== undefined) {
      updateData.bio = bio && bio.trim() ? bio.trim() : null;
    }

    // Add RUT if provided
    if (rut !== undefined) {
      updateData.rut = rut && rut.trim() ? rut.trim() : null;
    }

    // Increment change counts only if changes are being made
    if (nameChanged) {
      updateData.nameChangeCount = currentUser.nameChangeCount + 1;
    }

    if (usernameChanged) {
      updateData.usernameChangeCount = currentUser.usernameChangeCount + 1;
    }

    // Add image if provided
    if (image !== undefined) {
      updateData.image = image;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        rut: true,
        bio: true,
        university: true,
        campus: true,
        nameChangeCount: true,
        usernameChangeCount: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        rut: true,
        bio: true,
        university: true,
        campus: true,
        nameChangeCount: true,
        usernameChangeCount: true
      }
    });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
