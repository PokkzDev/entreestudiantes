import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const { type, subject, message, email, name, turnstileToken } = await request.json();

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

    // Validate contact type
    const validTypes = ['general', 'support', 'business', 'account'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Tipo de consulta inválido." },
        { status: 400 }
      );
    }

    // Get user session if available
    const session = await getServerSession(authOptions);
    
    // Get IP address and user agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(/, /)[0] : request.headers.get("x-real-ip") || 'unknown';
    const userAgent = request.headers.get("user-agent") || 'unknown';

    // Create subject with contact prefix and name if provided
    let finalSubject = subject.trim();
    if (name && name.trim()) {
      finalSubject = `[CONTACTO] ${name.trim()}: ${subject.trim()}`;
    } else if (session?.user?.name) {
      finalSubject = `[CONTACTO] ${session.user.name}: ${subject.trim()}`;
    } else {
      finalSubject = `[CONTACTO] ${subject.trim()}`;
    }

    // Create message with additional context
    let finalMessage = message.trim();
    if (name && name.trim() && !session) {
      finalMessage = `Nombre: ${name.trim()}\n\n${message.trim()}`;
    }

    // Map contact types to feedback types for database consistency
    const feedbackTypeMap = {
      'general': 'contact_general',
      'support': 'contact_support', 
      'business': 'contact_business',
      'account': 'contact_account'
    };

    // Create feedback record with contact prefix
    const feedback = await prisma.feedback.create({
      data: {
        type: feedbackTypeMap[type],
        subject: finalSubject,
        message: finalMessage,
        email: email ? email.trim().toLowerCase() : null,
        userId: session?.user?.id || null,
        priority: type === 'business' ? 'high' : type === 'account' ? 'high' : 'medium',
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tu mensaje ha sido enviado exitosamente. Te responderemos pronto.",
      contactId: feedback.id
    });

  } catch (error) {
    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor. Por favor, intenta nuevamente." },
      { status: 500 }
    );
  }
} 