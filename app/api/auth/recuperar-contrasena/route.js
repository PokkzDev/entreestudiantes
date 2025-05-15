import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { randomBytes } from "crypto";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || req.ip || "unknown";
  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." }), {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) }
    });
  }

  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "Email requerido" }), { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isVerified) {
    // No revelar si el email existe o si está verificado
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
  // Generar token seguro y expiración (1h)
  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: expiry,
    },
  });
  // Enviar email con link (mismo diseño que registro)
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-contrasena?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Recupera tu contraseña en Entreestudiantes",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #2563eb;">Recupera tu contraseña</h1>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Para continuar, haz clic en el siguiente enlace:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(90deg, #334155 0%, #6366f1 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Restablecer mi contraseña</a>
        </div>
        <p>Si no solicitaste restablecer la contraseña, puedes ignorar este correo.</p>
        <p>Este enlace expirará en 1 hora.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
          <p>Entreestudiantes - La plataforma para estudiantes universitarios</p>
        </div>
      </div>
    `
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
