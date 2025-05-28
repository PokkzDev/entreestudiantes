import { getUserModerationStatus, shouldUserBeLoggedOut } from './userModeration';

/**
 * Debug utility to check user moderation status
 * @param {Object} user - User object from database
 */
export function debugUserStatus(user) {
  console.log('=== USER MODERATION DEBUG ===');
  console.log('User ID:', user?.id);
  console.log('Username:', user?.username);
  console.log('Email:', user?.email);
  console.log('');
  
  console.log('Raw moderation flags:');
  console.log('- isBanned:', user?.isBanned);
  console.log('- isSuspended:', user?.isSuspended);
  console.log('- isActive:', user?.isActive);
  console.log('- suspensionEndsAt:', user?.suspensionEndsAt);
  console.log('- suspensionReason:', user?.suspensionReason);
  console.log('');
  
  const status = getUserModerationStatus(user);
  console.log('Computed status:');
  console.log('- isBanned:', status.isBanned);
  console.log('- isSuspended:', status.isSuspended);
  console.log('- isActive:', status.isActive);
  console.log('- canLogin:', status.canLogin);
  console.log('- shouldLogout:', status.shouldLogout);
  console.log('');
  
  const logoutCheck = shouldUserBeLoggedOut(user);
  console.log('Logout check:');
  console.log('- shouldLogout:', logoutCheck.shouldLogout);
  console.log('- reason:', logoutCheck.reason);
  console.log('=============================');
  
  return status;
}

/**
 * Test the middleware logic without actually running middleware
 * @param {Object} token - NextAuth token object
 * @param {string} pathname - The path being accessed
 */
export function debugMiddlewareLogic(token, pathname) {
  console.log('=== MIDDLEWARE DEBUG ===');
  console.log('Path:', pathname);
  console.log('Token exists:', !!token);
  
  if (token) {
    console.log('Token moderation flags:');
    console.log('- isBanned:', token.isBanned);
    console.log('- isSuspended:', token.isSuspended);
    console.log('- isActive:', token.isActive);
    console.log('- suspensionEndsAt:', token.suspensionEndsAt);
  }
  
  // Check if it's a public route
  const publicRoutes = [
    '/',
    '/login', 
    '/registro', 
    '/completar-registro', 
    '/recuperar-contrasena', 
    '/reset-contrasena',
    '/busqueda',
    '/publicacion'
  ];
  
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
  
  console.log('Is public route:', isPublicRoute);
  
  // Check if user should be redirected
  let shouldRedirect = false;
  let redirectReason = '';
  
  if (token && (
    token.isBanned === true || 
    token.isActive === false ||
    (token.isSuspended === true && token.suspensionEndsAt && new Date() < new Date(token.suspensionEndsAt))
  )) {
    shouldRedirect = true;
    redirectReason = 'User is banned/suspended/inactive';
  }
  
  console.log('Should redirect to logout:', shouldRedirect);
  console.log('Redirect reason:', redirectReason);
  
  // Check authorization
  const authorized = isPublicRoute || !!token;
  console.log('Authorized:', authorized);
  console.log('========================');
  
  return {
    isPublicRoute,
    shouldRedirect,
    redirectReason,
    authorized
  };
}

const debugModeration = { debugUserStatus, debugMiddlewareLogic };

export default debugModeration; 