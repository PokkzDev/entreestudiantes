import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return new Response(JSON.stringify({ error: "Token y nueva contraseña requeridos" }), { status: 400 });
  }
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { gte: new Date() },
    },
  });
  if (!user) {
    return new Response(JSON.stringify({ error: "Token inválido o expirado" }), { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    },
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
