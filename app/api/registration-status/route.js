import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const registrationConfig = await prisma.appConfig.findUnique({
      where: { key: 'user_registration_enabled' }
    });

    const isEnabled = registrationConfig?.value === 'true';

    return NextResponse.json({
      enabled: isEnabled,
      message: isEnabled ? null : 'El registro de usuarios está temporalmente deshabilitado.'
    });
  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json(
      { enabled: false, message: 'Error al verificar el estado del registro.' },
      { status: 500 }
    );
  }
} 