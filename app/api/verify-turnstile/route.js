import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de Turnstile requerido' },
        { status: 400 }
      );
    }

    // Verify the token with Cloudflare
    const formData = new FormData();
    formData.append('secret', process.env.CLOUDFARE_TURNSTILE_SECRET_KEY);
    formData.append('response', token);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Verificación de Turnstile fallida' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying Turnstile:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 