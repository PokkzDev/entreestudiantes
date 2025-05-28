/**
 * Utility functions for checking user moderation status
 */

/**
 * Check if a user is currently banned
 * @param {Object} user - User object with moderation fields
 * @returns {boolean} - True if user is banned
 */
export function isUserBanned(user) {
  return user?.isBanned === true;
}

/**
 * Check if a user is currently suspended
 * @param {Object} user - User object with moderation fields
 * @returns {boolean} - True if user is currently suspended
 */
export function isUserSuspended(user) {
  if (!user?.isSuspended) return false;
  
  // If there's no end date, it's an indefinite suspension
  if (!user.suspensionEndsAt) return true;
  
  // Check if suspension has expired
  return new Date() < new Date(user.suspensionEndsAt);
}

/**
 * Check if a user is currently restricted
 * @param {Object} user - User object with moderation fields
 * @returns {boolean} - True if user is restricted
 */
export function isUserRestricted(user) {
  if (!user?.isRestricted) return false;
  
  // If there's no end date, it's an indefinite restriction
  if (!user.restrictionEndsAt) return true;
  
  // Check if restriction has expired
  return new Date() < new Date(user.restrictionEndsAt);
}

/**
 * Check if a user is currently muted
 * @param {Object} user - User object with moderation fields
 * @returns {boolean} - True if user is muted
 */
export function isUserMuted(user) {
  if (!user?.isMuted) return false;
  
  // If there's no end date, it's an indefinite mute
  if (!user.muteEndsAt) return true;
  
  // Check if mute has expired
  return new Date() < new Date(user.muteEndsAt);
}

/**
 * Check if a user account is active
 * @param {Object} user - User object with moderation fields
 * @returns {boolean} - True if user account is active
 */
export function isUserActive(user) {
  return user?.isActive === true;
}

/**
 * Check if a user can login (not banned, not suspended, and active)
 * @param {Object} user - User object with moderation fields
 * @returns {Object} - { canLogin: boolean, reason?: string }
 */
export function canUserLogin(user) {
  if (isUserBanned(user)) {
    return {
      canLogin: false,
      reason: "Tu cuenta ha sido suspendida permanentemente. Contacta al soporte si crees que esto es un error."
    };
  }
  
  if (!isUserActive(user)) {
    return {
      canLogin: false,
      reason: "Tu cuenta está desactivada. Contacta al soporte para más información."
    };
  }
  
  if (isUserSuspended(user)) {
    if (user.suspensionEndsAt) {
      const endDate = new Date(user.suspensionEndsAt).toLocaleDateString('es-ES');
      return {
        canLogin: false,
        reason: `Tu cuenta está suspendida hasta el ${endDate}. Razón: ${user.suspensionReason || 'No especificada'}`
      };
    } else {
      return {
        canLogin: false,
        reason: `Tu cuenta está suspendida indefinidamente. Razón: ${user.suspensionReason || 'No especificada'}`
      };
    }
  }
  
  return { canLogin: true };
}

/**
 * Check if a user can perform actions that require posting/commenting
 * @param {Object} user - User object with moderation fields
 * @returns {Object} - { canPost: boolean, reason?: string }
 */
export function canUserPost(user) {
  const loginCheck = canUserLogin(user);
  if (!loginCheck.canLogin) {
    return loginCheck;
  }
  
  if (isUserRestricted(user)) {
    return {
      canPost: false,
      reason: "Tu cuenta tiene restricciones de publicación. Contacta al soporte para más información."
    };
  }
  
  return { canPost: true };
}

/**
 * Check if a user can send messages or comments
 * @param {Object} user - User object with moderation fields
 * @returns {Object} - { canMessage: boolean, reason?: string }
 */
export function canUserMessage(user) {
  const postCheck = canUserPost(user);
  if (!postCheck.canPost) {
    return postCheck;
  }
  
  if (isUserMuted(user)) {
    if (user.muteEndsAt) {
      const endDate = new Date(user.muteEndsAt).toLocaleDateString('es-ES');
      return {
        canMessage: false,
        reason: `No puedes enviar mensajes hasta el ${endDate}. Razón: ${user.muteReason || 'No especificada'}`
      };
    } else {
      return {
        canMessage: false,
        reason: `No puedes enviar mensajes. Razón: ${user.muteReason || 'No especificada'}`
      };
    }
  }
  
  return { canMessage: true };
}

/**
 * Check if a user should be immediately logged out due to moderation status
 * This is used for real-time session validation
 * @param {Object} user - User object with moderation fields
 * @returns {Object} - { shouldLogout: boolean, reason?: string }
 */
export function shouldUserBeLoggedOut(user) {
  const loginCheck = canUserLogin(user);
  if (!loginCheck.canLogin) {
    return {
      shouldLogout: true,
      reason: loginCheck.reason
    };
  }
  
  return { shouldLogout: false };
}

/**
 * Get user moderation status summary
 * @param {Object} user - User object with moderation fields
 * @returns {Object} - Summary of user's moderation status
 */
export function getUserModerationStatus(user) {
  return {
    isBanned: isUserBanned(user),
    isSuspended: isUserSuspended(user),
    isRestricted: isUserRestricted(user),
    isMuted: isUserMuted(user),
    isActive: isUserActive(user),
    isWarned: user?.isWarned === true,
    isFlagged: user?.isFlagged === true,
    canLogin: canUserLogin(user),
    canPost: canUserPost(user),
    canMessage: canUserMessage(user),
    shouldLogout: shouldUserBeLoggedOut(user)
  };
} 