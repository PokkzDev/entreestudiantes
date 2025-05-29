import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateEmailDomain } from '@/lib/emailValidation';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(request) {
  try {
    const { email, turnstileToken } = await request.json();

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
            { message: "Verificación de seguridad fallida. Por favor, intenta de nuevo." },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Turnstile verification error:', error);
        return NextResponse.json(
          { message: "Error en la verificación de seguridad. Por favor, intenta de nuevo." },
          { status: 400 }
        );
      }
    }

    // Validate email domain first
    const domainValidation = await validateEmailDomain(email);
    if (!domainValidation.isValid) {
      return NextResponse.json(
        { message: domainValidation.message },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'No se encontró una cuenta con este correo electrónico' },
        { status: 404 }
      );
    }
    if (existingUser.isVerified) {
      return NextResponse.json(
        { message: 'La cuenta ya está verificada. Por favor inicia sesión.' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = Date.now().toString() + Math.random().toString(36).substring(2, 15);
    
    // Update user with new verification token
    await prisma.user.update({
      where: { email },
      data: { verificationToken }
    });

    // Create verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/completar-registro?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    // Send email with verification link using reusable sendEmail function
    const emailResponse = await sendEmail({
      to: email,
      subject: 'Completa tu registro en Entreestudiantes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #2563eb;">¡Bienvenido a Entreestudiantes!</h1>
          <p>Recibimos una solicitud para reenviar el correo de verificación. Para completar tu cuenta, por favor haz clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(90deg, #334155 0%, #6366f1 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Completar mi registro</a>
          </div>
          <p>Si no solicitaste crear una cuenta, puedes ignorar este correo.</p>
          <p>Este enlace expirará en 24 horas.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>Entreestudiantes - La plataforma para estudiantes universitarios</p>
          </div>
        </div>
      `
    });

    if (emailResponse.error) {
      console.error('Error enviando email de verificación:', emailResponse.error);
      return NextResponse.json(
        { message: 'No se pudo enviar el correo de verificación. Intenta nuevamente más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Se ha enviado un nuevo correo electrónico con instrucciones para completar el registro.' 
    });
    
  } catch (error) {
    console.error('Error al reenviar el correo de verificación:', error);
    return NextResponse.json(
      { message: 'Error al procesar la solicitud de reenvío' },
      { status: 500 }
    );
  }
}
