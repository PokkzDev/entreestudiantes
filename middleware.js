import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// ============================================================================
// ROUTE CONFIGURATIONS - Easy to edit!
// ============================================================================

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Home page
  '/login', 
  '/registro', 
  '/completar-registro', 
  '/recuperar-contrasena', 
  '/reset-contrasena',
  '/busqueda', // Search page
  '/publicacion', // Individual publication pages
  '/perfil', // User profile pages
  '/planes', // Plans page
  '/sugerencias', // Suggestions page
  '/contacto', // Contact page
  '/terminos-uso', // Terms of use
  '/politica-privacidad' // Privacy policy
];

// API routes that should be excluded from authentication
const PUBLIC_API_ROUTES = [
  'api/auth',
  'api/register',
  'api/resend-verification',
  'api/complete-registration',
  'api/validate-registration-token', // Registration token validation
  'api/allowed-domains',
  'api/busqueda',
  'api/publicacion',
  'api/perfil',
  'api/check-session',
  'api/check-verified',
  'api/flow/webhook',
  'api/flow/return',
  'api/flow/refund-webhook',
  'api/verify-turnstile',
  'api/feedback',
  'api/contact',
  'api/cron',
  'api/update-session',
  'api/account-tiers',
  'api/registration-status',
  'api/analytics'
];

// Static assets that should be excluded from authentication
const STATIC_ASSETS = [
  '_next/static',
  '_next/image',
  'favicon.ico',
  'pageImages',
  'images'
];

// Suspicious patterns to block (security)
const SUSPICIOUS_PATTERNS = [
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

function isSuspiciousRequest(pathname, callbackUrl) {
  const isSuspiciousPath = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(pathname));
  const isSuspiciousCallback = callbackUrl && 
    SUSPICIOUS_PATTERNS.some(pattern => pattern.test(decodeURIComponent(callbackUrl)));
  
  return isSuspiciousPath || isSuspiciousCallback;
}

function isUserBannedOrSuspended(token) {
  if (!token) return false;
  
  return (
    token.isBanned === true || 
    token.isActive === false ||
    (token.isSuspended === true && token.suspensionEndsAt && new Date() < new Date(token.suspensionEndsAt)) ||
    (token.isSuspended === true && !token.suspensionEndsAt) // Indefinite suspension
  );
}

function getSuspensionMessage(token) {
  if (token.isBanned === true) {
    return "Tu cuenta ha sido suspendida permanentemente. Contacta al soporte si crees que esto es un error.";
  } else if (token.isActive === false) {
    return "Tu cuenta está desactivada. Contacta al soporte para más información.";
  } else if (token.isSuspended === true && token.suspensionEndsAt) {
    const endDate = new Date(token.suspensionEndsAt).toLocaleDateString('es-ES');
    return `Tu cuenta está suspendida hasta el ${endDate}. Razón: ${token.suspensionReason || 'No especificada'}`;
  } else if (token.isSuspended === true) {
    return `Tu cuenta está suspendida indefinidamente. Razón: ${token.suspensionReason || 'No especificada'}`;
  }
  return "Tu sesión ha expirado";
}

// ============================================================================
// MIDDLEWARE LOGIC
// ============================================================================

export default withAuth(
  function middleware(req) {
    const { pathname, searchParams } = req.nextUrl;
    
    // Debug logging for payment routes
    if (pathname.includes('/api/payments')) {
      console.log(`🔍 Middleware processing payment route: ${pathname}`);
      console.log('🔍 This should be excluded from authentication!');
    }
    
    // Security: Block suspicious requests
    const callbackUrl = searchParams.get('callbackUrl');
    if (isSuspiciousRequest(pathname, callbackUrl)) {
      console.warn(`Blocked suspicious request: ${pathname}${callbackUrl ? ` with callback: ${callbackUrl}` : ''}`);
      return NextResponse.json(
        { error: "Access denied" }, 
        { status: 403 }
      );
    }
    
    const token = req.nextauth.token;
    
    // Handle banned/suspended users
    if (isUserBannedOrSuspended(token)) {
      const message = getSuspensionMessage(token);
      
      // Redirect to login with appropriate message
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('message', message);
      url.searchParams.set('suspended', 'true');
      
      const response = NextResponse.redirect(url);
      
      // Clear NextAuth session cookies
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
        // Debug logging for payment routes
        if (req.nextUrl.pathname.includes('/api/payments')) {
          console.log(`🔍 Authorized callback for payment route: ${req.nextUrl.pathname}`);
          console.log('🔍 This should return true without requiring authentication!');
          return true;
        }
        
        // Check if it's a public route
        if (isPublicRoute(req.nextUrl.pathname)) {
          return true;
        }
        
        // For protected routes, require a valid token
        return !!token;
      },
    },
  }
);

// ============================================================================
// MATCHER CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    "/((?!api/auth|api/register|api/resend-verification|api/complete-registration|api/validate-registration-token|api/allowed-domains|api/busqueda|api/publicacion|api/perfil|api/check-session|api/check-verified|api/flow/webhook|api/flow/return|api/flow/refund-webhook|api/verify-turnstile|api/feedback|api/contact|api/cron|api/update-session|api/account-tiers|api/registration-status|api/analytics|_next/static|_next/image|favicon.ico|pageImages|images).*)"
  ],
}; 