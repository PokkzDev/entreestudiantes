import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { canUserLogin, canUserPost, canUserMessage } from "./userModeration";

/**
 * Get the current session and check if user is authenticated
 * @param {Request} request - The request object
 * @returns {Promise<{session: Object|null, user: Object|null}>}
 */
export async function getAuthenticatedUser(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { session: null, user: null };
  }
  
  return { session, user: session.user };
}

/**
 * Check if user is authenticated and can login (not banned/suspended)
 * @param {Request} request - The request object
 * @returns {Promise<{authorized: boolean, user: Object|null, error?: string, status?: number}>}
 */
export async function requireAuth(request) {
  const { session, user } = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      authorized: false,
      user: null,
      error: "No autorizado",
      status: 401
    };
  }
  
  const loginCheck = canUserLogin(user);
  if (!loginCheck.canLogin) {
    return {
      authorized: false,
      user: null,
      error: loginCheck.reason,
      status: 403
    };
  }
  
  return {
    authorized: true,
    user,
    session
  };
}

/**
 * Check if user is authenticated and can post/create content
 * @param {Request} request - The request object
 * @returns {Promise<{authorized: boolean, user: Object|null, error?: string, status?: number}>}
 */
export async function requirePostAuth(request) {
  const { session, user } = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      authorized: false,
      user: null,
      error: "No autorizado",
      status: 401
    };
  }
  
  const postCheck = canUserPost(user);
  if (!postCheck.canPost) {
    return {
      authorized: false,
      user: null,
      error: postCheck.reason,
      status: 403
    };
  }
  
  return {
    authorized: true,
    user,
    session
  };
}

/**
 * Check if user is authenticated and can send messages/comments
 * @param {Request} request - The request object
 * @returns {Promise<{authorized: boolean, user: Object|null, error?: string, status?: number}>}
 */
export async function requireMessageAuth(request) {
  const { session, user } = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      authorized: false,
      user: null,
      error: "No autorizado",
      status: 401
    };
  }
  
  const messageCheck = canUserMessage(user);
  if (!messageCheck.canMessage) {
    return {
      authorized: false,
      user: null,
      error: messageCheck.reason,
      status: 403
    };
  }
  
  return {
    authorized: true,
    user,
    session
  };
} 