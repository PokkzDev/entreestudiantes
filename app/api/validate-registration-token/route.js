import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Email y token son requeridos' 
        },
        { status: 400 }
      );
    }

    // Check if user registration is enabled
    const registrationConfig = await prisma.appConfig.findUnique({
      where: { key: 'user_registration_enabled' }
    });

    if (!registrationConfig || registrationConfig.value !== 'true') {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'El registro de usuarios está temporalmente deshabilitado.' 
        },
        { status: 403 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isVerified: true,
        verificationToken: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Email no encontrado. El enlace de registro puede haber expirado.' 
        },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Esta cuenta ya está verificada. Puedes iniciar sesión directamente.' 
        },
        { status: 400 }
      );
    }

    // Check if token matches
    if (!user.verificationToken || user.verificationToken !== token) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Token inválido. El enlace de registro puede haber expirado o ser incorrecto.' 
        },
        { status: 400 }
      );
    }

    // Check if token has expired (example: 24 hours)
    const tokenAge = Date.now() - new Date(user.createdAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (tokenAge > maxAge) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'El enlace de registro ha expirado. Por favor solicita un nuevo enlace de registro.' 
        },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      message: 'Token válido',
      email: user.email
    });

  } catch (error) {
    console.error('Error validating registration token:', error);
    return NextResponse.json(
      { 
        valid: false, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 