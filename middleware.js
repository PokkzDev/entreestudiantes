import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname, searchParams } = req.nextUrl;
    
    // Debug logging for webhook routes
    if (pathname.includes('/api/payments')) {
      console.log(`🔍 Middleware processing payment route: ${pathname}`);
      console.log('🔍 This should be excluded from authentication!');
    }
    
    // Security: Block WordPress admin and suspicious requests
    const suspiciousPatterns = [
      /wp-admin/i,
      /wp-content/i,
      /wp-includes/i,
      /xmlrpc\.php/i,
      /wp-login\.php/i,
      /phpmyadmin/i,
      /admin/i,
      /administrator/i,
      /setup-config\.php/i
    ];
    
    // Check URL path and callback URLs for suspicious patterns
    const callbackUrl = searchParams.get('callbackUrl');
    const isSuspiciousPath = suspiciousPatterns.some(pattern => pattern.test(pathname));
    const isSuspiciousCallback = callbackUrl && suspiciousPatterns.some(pattern => pattern.test(decodeURIComponent(callbackUrl)));
    
    if (isSuspiciousPath || isSuspiciousCallback) {
      console.warn(`Blocked suspicious request: ${pathname}${callbackUrl ? ` with callback: ${callbackUrl}` : ''}`);
      return NextResponse.json(
        { error: "Access denied" }, 
        { status: 403 }
      );
    }
    
    const token = req.nextauth.token;
    
    // If user is banned, suspended (and suspension hasn't expired), or inactive, redirect to login
    // Note: We need to explicitly check for false, not just falsy values
    if (token && (
      token.isBanned === true || 
      token.isActive === false ||
      (token.isSuspended === true && token.suspensionEndsAt && new Date() < new Date(token.suspensionEndsAt)) ||
      (token.isSuspended === true && !token.suspensionEndsAt) // Indefinite suspension
    )) {
      // Determine the appropriate message based on the user's status
      let message = "Tu sesión ha expirado";
      if (token.isBanned === true) {
        message = "Tu cuenta ha sido suspendida permanentemente. Contacta al soporte si crees que esto es un error.";
      } else if (token.isActive === false) {
        message = "Tu cuenta está desactivada. Contacta al soporte para más información.";
      } else if (token.isSuspended === true && token.suspensionEndsAt) {
        const endDate = new Date(token.suspensionEndsAt).toLocaleDateString('es-ES');
        message = `Tu cuenta está suspendida hasta el ${endDate}. Razón: ${token.suspensionReason || 'No especificada'}`;
      } else if (token.isSuspended === true) {
        message = `Tu cuenta está suspendida indefinidamente. Razón: ${token.suspensionReason || 'No especificada'}`;
      }
      
      // Redirect directly to login with the message, avoiding NextAuth signout flow
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('message', message);
      url.searchParams.set('suspended', 'true'); // Flag to indicate this is a suspension redirect
      
      const response = NextResponse.redirect(url);
      
      // Clear the NextAuth session cookies to ensure clean logout
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('__Secure-next-auth.session-token');
      response.cookies.delete('next-auth.csrf-token');
      response.cookies.delete('__Host-next-auth.csrf-token');
      
      return response;
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Debug logging for webhook routes
        if (req.nextUrl.pathname.includes('/api/payments')) {
          console.log(`🔍 Authorized callback for payment route: ${req.nextUrl.pathname}`);
          console.log('🔍 This should return true without requiring authentication!');
          return true; // Always allow payment routes
        }
        
        // Define public routes that don't require authentication
        const publicRoutes = [
          '/', // Home page
          '/login', 
          '/registro', 
          '/completar-registro', 
          '/recuperar-contrasena', 
          '/reset-contrasena',
          '/busqueda', // Search page should be public
          '/publicacion', // Individual publication pages should be public (will be handled by API)
          '/planes' // Plans page should be public to allow users to see pricing
        ];
        
        const isPublicRoute = publicRoutes.some(route => {
          if (route === '/') {
            return req.nextUrl.pathname === '/';
          }
          return req.nextUrl.pathname.startsWith(route);
        });
        
        if (isPublicRoute) {
          return true;
        }
        
        // For protected routes, require a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|api/register|api/resend-verification|api/complete-registration|api/allowed-domains|api/busqueda|api/publicacion|api/check-session|api/check-verified|api/payments/verify|api/payments/failure|api/payments/pending|api/payments/success|api/payments/webhook|api/payments|api/verify-turnstile|api/cron|api/update-session|_next/static|_next/image|favicon.ico|pageImages|images).*)"
  ],
}; 