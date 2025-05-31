import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { email, token, username, name, password, university, campus } = await request.json();

    // Backend validation
    if (!username || typeof username !== 'string' || username.length < 4) {
      return NextResponse.json(
        { message: 'El nombre de usuario debe tener al menos 4 caracteres.' },
        { status: 400 }
      );
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { message: 'El nombre no puede estar vacío.' },
        { status: 400 }
      );
    }
    if (!university || typeof university !== 'string' || university.trim().length === 0) {
      return NextResponse.json(
        { message: 'Debes seleccionar una universidad.' },
        { status: 400 }
      );
    }
    if (!campus || typeof campus !== 'string' || campus.trim().length === 0) {
      return NextResponse.json(
        { message: 'Debes seleccionar un campus.' },
        { status: 400 }
      );
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!password || typeof password !== 'string' || !passwordRegex.test(password)) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.' },
        { status: 400 }
      );
    }

    // Verify if the email exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Email no encontrado o el enlace de registro ha expirado' },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json(
        { message: 'La cuenta ya está verificada. Por favor inicia sesión.' },
        { status: 400 }
      );
    }

    // Check if token matches
    if (!token || user.verificationToken !== token) {
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Verifica que el username no esté en uso por otro usuario
    const usernameExists = await prisma.user.findFirst({
      where: {
        username,
        id: { not: user.id }
      }
    });
    if (usernameExists) {
      return NextResponse.json(
        { message: 'El nombre de usuario ya está en uso.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user with the new information y marcar como verificado
    await prisma.user.update({
      where: { email },
      data: {
        username,
        name,
        password: hashedPassword,
        university,
        campus,
        isVerified: true,
        verificationToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registro completado exitosamente'
    });
  } catch (error) {
    console.error('Error completing registration:', error);
    return NextResponse.json(
      { message: 'Error al completar el registro' },
      { status: 500 }
    );
  }
}
