import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const { type, subject, message, email, turnstileToken } = await request.json();

    // Verify Turnstile token first
    if (turnstileToken) {
      try {
        const formData = new FormData();
        formData.append('secret', process.env.CLOUDFARE_TURNSTILE_SECRET_KEY);
        formData.append('response', turnstileToken);

        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          return NextResponse.json(
            { success: false, message: "Verificación de seguridad fallida. Por favor, intenta de nuevo." },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Turnstile verification error:', error);
        return NextResponse.json(
          { success: false, message: "Error en la verificación de seguridad. Por favor, intenta de nuevo." },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!type || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "Todos los campos requeridos deben ser completados." },
        { status: 400 }
      );
    }

    // Validate type - include both feedback and contact types
    const validTypes = [
      'feedback', 'bug', 'feature', 'other', // Original feedback types
      'contact_general', 'contact_support', 'contact_business', 'contact_account' // Contact types
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Tipo de sugerencia inválido." },
        { status: 400 }
      );
    }

    // Get user session if available
    const session = await getServerSession(authOptions);
    
    // Get IP address and user agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(/, /)[0] : request.headers.get("x-real-ip") || 'unknown';
    const userAgent = request.headers.get("user-agent") || 'unknown';

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        type,
        subject: subject.trim(),
        message: message.trim(),
        email: email ? email.trim().toLowerCase() : null,
        userId: session?.user?.id || null,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tu sugerencia ha sido enviada exitosamente. ¡Gracias por tu feedback!",
      feedbackId: feedback.id
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor. Por favor, intenta nuevamente." },
      { status: 500 }
    );
  }
} 