import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { shouldUserBeLoggedOut } from "@/lib/userModeration";
import prisma from "@/lib/prisma";

// GET /api/check-session - Check if current session is still valid
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        valid: false, 
        reason: "No hay sesión activa" 
      }, { status: 401 });
    }

    // Fetch fresh user data from database to check current moderation status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isBanned: true,
        isSuspended: true,
        isActive: true,
        suspensionEndsAt: true,
        suspensionReason: true,
        banReason: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        valid: false, 
        reason: "Usuario no encontrado" 
      }, { status: 404 });
    }

    // Check if user should be logged out
    const logoutCheck = shouldUserBeLoggedOut(user);
    
    if (logoutCheck.shouldLogout) {
      return NextResponse.json({ 
        valid: false, 
        reason: logoutCheck.reason,
        shouldLogout: true
      }, { status: 403 });
    }

    return NextResponse.json({ 
      valid: true,
      user: {
        id: user.id,
        isBanned: user.isBanned,
        isSuspended: user.isSuspended,
        isActive: user.isActive
      }
    });
    
  } catch (error) {
    console.error("Error checking session:", error);
    return NextResponse.json({ 
      valid: false, 
      reason: "Error interno del servidor" 
    }, { status: 500 });
  }
} 