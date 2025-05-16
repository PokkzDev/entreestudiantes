import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
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

  const { token, password } = await req.json();
  if (!token || !password) {
    return new Response(JSON.stringify({ error: "Token y nueva contraseña requeridos" }), { status: 400 });
  }
  // Password validation (same as registry)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return new Response(JSON.stringify({ error: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo." }), { status: 400 });
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
