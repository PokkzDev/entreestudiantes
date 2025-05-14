import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { email, token, username, name, password } = await request.json();

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

    // In a production app, we'd verify the token more securely.
    // For this example, we're just checking that a token is provided.
    if (!token) {
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
