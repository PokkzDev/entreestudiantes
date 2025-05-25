import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { chileanUniversities } from "@/utils/unicampus";

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const { university, campus } = await request.json();

    // Validate input
    if (!university || !campus) {
      return NextResponse.json(
        { message: "Universidad y campus son requeridos" },
        { status: 400 }
      );
    }

    // Validate university exists in our list
    const universityData = chileanUniversities.find(uni => uni.name === university);
    if (!universityData) {
      return NextResponse.json(
        { message: "Universidad no válida" },
        { status: 400 }
      );
    }

    // Validate campus exists for the selected university
    if (!universityData.campuses.includes(campus)) {
      return NextResponse.json(
        { message: "Campus no válido para la universidad seleccionada" },
        { status: 400 }
      );
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        university: true,
        campus: true,
        universityChangeCount: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Check if user has reached the limit of changes
    if (currentUser.universityChangeCount >= 3) {
      return NextResponse.json(
        { message: "Has alcanzado el límite de cambios de universidad y campus (3 cambios máximo)" },
        { status: 400 }
      );
    }

    // Check if the values are actually different
    if (currentUser.university === university && currentUser.campus === campus) {
      return NextResponse.json(
        { message: "Los valores seleccionados son los mismos que los actuales" },
        { status: 400 }
      );
    }

    // Update user with new university and campus, and increment change count
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        university,
        campus,
        universityChangeCount: currentUser.universityChangeCount + 1,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        university: true,
        campus: true,
        universityChangeCount: true,
        image: true,
        bio: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Universidad y campus actualizados exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating university and campus:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 