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
        turnstileToken: { label: "Turnstile Token", type: "text", optional: true },
      },
      async authorize(credentials) {
        // Verify Turnstile token first
        if (credentials.turnstileToken) {
          try {
            const formData = new FormData();
            formData.append('secret', process.env.CLOUDFARE_TURNSTILE_SECRET_KEY);
            formData.append('response', credentials.turnstileToken);

            const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              body: formData,
            });

            const result = await response.json();

            if (!result.success) {
              throw new Error("Verificación de seguridad fallida. Por favor, intenta de nuevo.");
            }
          } catch (error) {
            console.error('Turnstile verification error:', error);
            throw new Error("Error en la verificación de seguridad. Por favor, intenta de nuevo.");
          }
        }

        // Permitir login con email o username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier }
            ]
          }
        });
        
        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          return null;
        }

        // Check if account is banned
        if (user.isBanned) {
          throw new Error("Tu cuenta ha sido suspendida permanentemente. Contacta al soporte si crees que esto es un error.");
        }

        // Check if account is inactive
        if (!user.isActive) {
          throw new Error("Tu cuenta está desactivada. Contacta al soporte para más información.");
        }

        // Check if account is suspended and if suspension is still active
        if (user.isSuspended) {
          if (user.suspensionEndsAt && new Date() < user.suspensionEndsAt) {
            const endDate = user.suspensionEndsAt.toLocaleDateString('es-ES');
            throw new Error(`Tu cuenta está suspendida hasta el ${endDate}. Razón: ${user.suspensionReason || 'No especificada'}`);
          } else if (user.suspensionEndsAt && new Date() >= user.suspensionEndsAt) {
            // Suspension has expired, automatically lift it
            await prisma.user.update({
              where: { id: user.id },
              data: {
                isSuspended: false,
                suspensionReason: null,
                suspensionEndsAt: null
              }
            });
            // Continue with login since suspension has expired
          } else {
            // Indefinite suspension
            throw new Error(`Tu cuenta está suspendida indefinidamente. Razón: ${user.suspensionReason || 'No especificada'}`);
          }
        }

        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastActivityAt: new Date()
          }
        });

        // Attach remember to user object for use in callbacks
        user.remember = credentials.remember === true || credentials.remember === 'true';
        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      if (user) {
        token.id = user.id;
        token.isVerified = user.isVerified;
        token.name = user.name || user.username;
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
        // Add moderation status fields
        token.isBanned = user.isBanned;
        token.isSuspended = user.isSuspended;
        token.isRestricted = user.isRestricted;
        token.isMuted = user.isMuted;
        token.isWarned = user.isWarned;
        token.isFlagged = user.isFlagged;
        token.isActive = user.isActive;
        token.suspensionEndsAt = user.suspensionEndsAt;
        token.suspensionReason = user.suspensionReason;
        // Add initial subscription data from user object
        token.accountTier = user.accountTier;
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
              createdAt: true,
              isBanned: true,
              isSuspended: true,
              isRestricted: true,
              isMuted: true,
              isWarned: true,
              isFlagged: true,
              isActive: true,
              suspensionEndsAt: true,
              suspensionReason: true,
              accountTier: true,
              subscriptions: {
                where: {
                  status: 'active',
                  endDate: {
                    gte: new Date()
                  }
                },
                orderBy: {
                  endDate: 'desc'
                },
                take: 1,
                select: {
                  id: true,
                  planId: true,
                  status: true,
                  startDate: true,
                  endDate: true,
                  autoRenew: true
                }
              }
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
            // Update moderation status fields
            token.isBanned = dbUser.isBanned;
            token.isSuspended = dbUser.isSuspended;
            token.isRestricted = dbUser.isRestricted;
            token.isMuted = dbUser.isMuted;
            token.isWarned = dbUser.isWarned;
            token.isFlagged = dbUser.isFlagged;
            token.isActive = dbUser.isActive;
            token.suspensionEndsAt = dbUser.suspensionEndsAt;
            token.suspensionReason = dbUser.suspensionReason;
            
            // Add subscription data
            token.accountTier = dbUser.accountTier;
            token.currentSubscription = dbUser.subscriptions?.[0] || null;
            
            // Calculate effective account tier
            if (token.currentSubscription && token.currentSubscription.status === 'active') {
              token.effectiveAccountTier = token.currentSubscription.planId;
              token.subscriptionStatus = 'active';
              token.subscriptionEndDate = token.currentSubscription.endDate;
            } else {
              token.effectiveAccountTier = 'free';
              token.subscriptionStatus = 'inactive';
              token.subscriptionEndDate = null;
            }
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error);
          // Continue with existing token data if database fetch fails
        }
      }

      // If this is the initial login, also fetch subscription data
      if (user && token.id) {
        try {
          const userWithSubscription = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              accountTier: true,
              subscriptions: {
                where: {
                  status: 'active',
                  endDate: {
                    gte: new Date()
                  }
                },
                orderBy: {
                  endDate: 'desc'
                },
                take: 1,
                select: {
                  id: true,
                  planId: true,
                  status: true,
                  startDate: true,
                  endDate: true,
                  autoRenew: true
                }
              }
            }
          });

          if (userWithSubscription) {
            token.accountTier = userWithSubscription.accountTier;
            token.currentSubscription = userWithSubscription.subscriptions?.[0] || null;
            
            // Calculate effective account tier
            if (token.currentSubscription && token.currentSubscription.status === 'active') {
              token.effectiveAccountTier = token.currentSubscription.planId;
              token.subscriptionStatus = 'active';
              token.subscriptionEndDate = token.currentSubscription.endDate;
            } else {
              token.effectiveAccountTier = 'free';
              token.subscriptionStatus = 'inactive';
              token.subscriptionEndDate = null;
            }
          }
        } catch (error) {
          console.error("Error fetching subscription data on login:", error);
          // Set defaults if fetch fails
          token.accountTier = user.accountTier || 'free';
          token.effectiveAccountTier = 'free';
          token.subscriptionStatus = 'inactive';
          token.subscriptionEndDate = null;
          token.currentSubscription = null;
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
        // Add moderation status fields to session
        session.user.isBanned = token.isBanned;
        session.user.isSuspended = token.isSuspended;
        session.user.isRestricted = token.isRestricted;
        session.user.isMuted = token.isMuted;
        session.user.isWarned = token.isWarned;
        session.user.isFlagged = token.isFlagged;
        session.user.isActive = token.isActive;
        session.user.suspensionEndsAt = token.suspensionEndsAt;
        session.user.suspensionReason = token.suspensionReason;
        
        // Add subscription data to session
        session.user.accountTier = token.accountTier;
        session.user.effectiveAccountTier = token.effectiveAccountTier;
        session.user.subscriptionStatus = token.subscriptionStatus;
        session.user.subscriptionEndDate = token.subscriptionEndDate;
        session.user.currentSubscription = token.currentSubscription;
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
