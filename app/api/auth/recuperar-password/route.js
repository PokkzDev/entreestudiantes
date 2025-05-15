import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { randomBytes } from "crypto";

export async function POST(req) {
  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "Email requerido" }), { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // No revelar si el email existe o no
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
  // Enviar email con link
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Recuperar contraseña",
    html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Este enlace expirará en 1 hora.</p>`
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
