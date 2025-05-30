// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname, searchParams } = req.nextUrl;
    
    // Debug logging for webhook and payment routes
    if (pathname === '/api/webhooks' || pathname.includes('/api/payments')) {
      console.log(`🔍 Skipping auth for route: ${pathname}`);
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
    
    const callbackUrl = searchParams.get('callbackUrl');
    const isSuspiciousPath = suspiciousPatterns.some(p => p.test(pathname));
    const isSuspiciousCallback =
      callbackUrl && suspiciousPatterns.some(p => p.test(decodeURIComponent(callbackUrl)));
    
    if (isSuspiciousPath || isSuspiciousCallback) {
      console.warn(`Blocked suspicious request: ${pathname}${callbackUrl ? ` with callback: ${callbackUrl}` : ''}`);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const token = req.nextauth.token;
    
    // Handle banned, suspended or inactive users
    if (token && (
      token.isBanned === true ||
      token.isActive === false ||
      (token.isSuspended === true && token.suspensionEndsAt && new Date() < new Date(token.suspensionEndsAt)) ||
      (token.isSuspended === true && !token.suspensionEndsAt)
    )) {
      let message = "Tu sesión ha expirado";
      if (token.isBanned) {
        message = "Tu cuenta ha sido suspendida permanentemente. Contacta al soporte si crees que esto es un error.";
      } else if (token.isActive === false) {
        message = "Tu cuenta está desactivada. Contacta al soporte para más información.";
      } else if (token.isSuspended && token.suspensionEndsAt) {
        const endDate = new Date(token.suspensionEndsAt).toLocaleDateString('es-ES');
        message = `Tu cuenta está suspendida hasta el ${endDate}. Razón: ${token.suspensionReason || 'No especificada'}`;
      } else {
        message = `Tu cuenta está suspendida indefinidamente. Razón: ${token.suspensionReason || 'No especificada'}`;
      }
      
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('message', message);
      url.searchParams.set('suspended', 'true');
      
      const response = NextResponse.redirect(url);
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
        const path = req.nextUrl.pathname;

        // Always allow your webhook and payment routes
        if (path === '/api/webhooks' || path.includes('/api/payments')) {
          console.log(`🔍 Authorized without auth: ${path}`);
          return true;
        }
        
        // Public page routes
        const publicRoutes = [
          '/', '/login', '/registro', '/completar-registro',
          '/recuperar-contrasena', '/reset-contrasena',
          '/busqueda', '/publicacion', '/planes'
        ];
        if (publicRoutes.some(route => 
              route === '/' 
                ? path === '/' 
                : path.startsWith(route)
            )) {
          return true;
        }
        
        // Otherwise require a valid session token
        return !!token;
      },
    },
  }
);

// Exclude auth from these paths: (we add api/webhooks alongside api/payments)
export const config = {
  matcher: [
    '/((?!api/auth|api/register|api/resend-verification|api/complete-registration|api/allowed-domains|' +
      'api/busqueda|api/publicacion|api/check-session|api/check-verified|api/payments|api/webhooks|' +
      'api/verify-turnstile|api/cron|api/update-session|_next/static|_next/image|favicon.ico|' +
      'pageImages|images).*)',
  ],
};
