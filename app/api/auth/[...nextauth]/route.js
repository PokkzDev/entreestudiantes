import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
        token.username = user.username;
        token.email = user.email;
        token.createdAt = user.createdAt;
        token.image = user.image;
        token.university = user.university;
        token.campus = user.campus;
        // Add these lines to include change counts in the token
        token.nameChangeCount = user.nameChangeCount;
        token.usernameChangeCount = user.usernameChangeCount;
        token.universityChangeCount = user.universityChangeCount;
        if (user.remember !== undefined) token.remember = user.remember;
      }

      // On session update, update token with new data or fetch from database
      if (trigger === "update") {
        if (user?.name) token.name = user.name;
        if (user?.username) token.username = user.username;
        if (user?.image !== undefined) token.image = user.image;
        if (user?.university !== undefined) token.university = user.university;
        if (user?.campus !== undefined) token.campus = user.campus;
        if (user?.nameChangeCount !== undefined) token.nameChangeCount = user.nameChangeCount;
        if (user?.usernameChangeCount !== undefined) token.usernameChangeCount = user.usernameChangeCount;
        if (user?.universityChangeCount !== undefined) token.universityChangeCount = user.universityChangeCount;
        // Fetch latest user data for counts if not provided
        if (!user?.nameChangeCount || !user?.usernameChangeCount || !user?.universityChangeCount) {
          if (token?.email) {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email }
            });
            if (dbUser) {
              token.nameChangeCount = dbUser.nameChangeCount;
              token.usernameChangeCount = dbUser.usernameChangeCount;
              token.universityChangeCount = dbUser.universityChangeCount;
              token.university = dbUser.university;
              token.campus = dbUser.campus;
            }
          }
        }
      }

      // Always fetch fresh user data from database to ensure UI reflects current state
      // This ensures that profile image changes are immediately visible on page reload
      if (token?.id && !user) { // Only fetch if this is not the initial login
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
              isVerified: true,
              university: true,
              campus: true,
              nameChangeCount: true,
              usernameChangeCount: true,
              universityChangeCount: true,
              createdAt: true
            }
          });
          
          if (dbUser) {
            // Update token with fresh data from database
            token.name = dbUser.name;
            token.username = dbUser.username;
            token.email = dbUser.email;
            token.image = dbUser.image;
            token.isVerified = dbUser.isVerified;
            token.university = dbUser.university;
            token.campus = dbUser.campus;
            token.nameChangeCount = dbUser.nameChangeCount;
            token.usernameChangeCount = dbUser.usernameChangeCount;
            token.universityChangeCount = dbUser.universityChangeCount;
            token.createdAt = dbUser.createdAt;
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error);
          // Continue with existing token data if database fetch fails
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.isVerified = token.isVerified;
        session.user.name = token.name;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.createdAt = token.createdAt;
        session.user.image = token.image;
        session.user.university = token.university;
        session.user.campus = token.campus;
        // Add these lines to include change counts in the session
        session.user.nameChangeCount = token.nameChangeCount;
        session.user.usernameChangeCount = token.usernameChangeCount;
        session.user.universityChangeCount = token.universityChangeCount;
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

export { handler as GET, handler as POST };
