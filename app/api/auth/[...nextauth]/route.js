import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
        remember: { label: "Recuérdame", type: "checkbox", optional: true },
      },
      async authorize(credentials) {
        // Permitir login con email o username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier }
            ]
          }
        });
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          // Attach remember to user object for use in callbacks
          user.remember = credentials.remember === true || credentials.remember === 'true';
          return user;
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      if (user) {
        token.id = user.id;
        token.isVerified = user.isVerified;
        token.name = user.name;
        token.username = user.username; // Add username to token
        token.email = user.email;
        token.createdAt = user.createdAt;
        // Pass remember to token for session callback
        if (user.remember !== undefined) token.remember = user.remember;
      }
      
      // On session update, fetch the latest user data from database
      if (trigger === "update" && token?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });
        if (dbUser) {
          token.username = dbUser.username;
          token.name = dbUser.name;
          token.isVerified = dbUser.isVerified;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.isVerified = token.isVerified;
        session.user.name = token.name;
        session.user.username = token.username; // Add username to session
        session.user.email = token.email;
        session.user.createdAt = token.createdAt;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // default 1 day
    updateAge: 24 * 60 * 60, // default 1 day
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // No-op, but could be used for logging
    }
  },
  pages: {
    signIn: "/login"
  },
  // Custom session maxAge per user (recuerdame)
  async createSession({ session, token }) {
    // If remember is set, extend session maxAge
    if (token.remember) {
      session.maxAge = 30 * 24 * 60 * 60; // 30 days
    }
    return session;
  }
};

const handler = NextAuth(authOptions);

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

  return handler(req);
}

export { handler as GET, handler as POST };
