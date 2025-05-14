import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { sendEmail } from '@/lib/sendEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, username } = await request.json();

    // Check if user already exists by email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { message: 'El correo electrónico o nombre de usuario ya está registrado y verificado.' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { message: 'El correo electrónico o nombre de usuario ya está registrado pero no verificado.' },
          { status: 400 }
        );
      }
    }

    // Generate verification token (simple timestamp + random string)
    const verificationToken = Date.now().toString() + Math.random().toString(36).substring(2, 15);
    
    // Create temporary user entry or store in a verification table
    const tempPassword = bcrypt.hashSync(Math.random().toString(36), 10);
    
    // Create the user with a temporary password and store the verification token
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: tempPassword,
        verificationToken: verificationToken,
      },
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
          <p>Gracias por registrarte. Para completar tu cuenta, por favor haz clic en el siguiente enlace:</p>
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
      message: 'Se ha enviado un correo electrónico con instrucciones para completar el registro.' 
    });
    
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { message: 'Error al procesar el registro' },
      { status: 500 }
    );
  }
}
