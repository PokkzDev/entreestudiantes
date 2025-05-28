import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authHelpers";
import { canUserPost } from "@/lib/userModeration";

export async function GET(request) {
  try {
    // Check if user is authenticated
    const authResult = await requireAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: authResult.status });
    }
    
    const { user } = authResult;
    
    // Check if user can post
    const postCheck = canUserPost(user);
    
    if (!postCheck.canPost) {
      return NextResponse.json({
        success: false,
        canPost: false,
        error: postCheck.reason,
        restrictionReason: user.restrictionReason,
        restrictionEndsAt: user.restrictionEndsAt
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      canPost: true
    });
    
  } catch (error) {
    console.error("Error checking post permission:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 });
  }
} 