// Account tier definitions and utilities

export const ACCOUNT_TIERS = {
  free: {
    name: "Gratuito",
    publicationLimit: 3,
    price: 0,
    features: [
      "Hasta 3 publicaciones registradas",
      "Funciones básicas",
      "Soporte comunitario"
    ],
    icon: "hand-holding-heart", // FontAwesome icon name
    color: "#64748b", // Better contrast
    bgColor: "#f8fafc"
  },
  basic: {
    name: "Premium",
    publicationLimit: 10,
    price: 2990, // CLP per month
    features: [
      "Hasta 10 publicaciones",
      "Funciones avanzadas",
      "Soporte por email",
      "Estadísticas básicas"
    ],
    icon: "star", // FontAwesome icon name
    color: "#2563eb", // Better contrast blue
    bgColor: "#eff6ff"
  },
  premium: {
    name: "Premium",
    publicationLimit: 25,
    price: 9990, // CLP per month
    features: [
      "Hasta 25 publicaciones",
      "Funciones premium",
      "Soporte prioritario",
      "Estadísticas avanzadas",
      "Destacar publicaciones"
    ],
    icon: "gem", // FontAwesome icon name
    color: "#7c3aed", // Better contrast purple
    bgColor: "#f3e8ff"
  },
  elite: {
    name: "Elite",
    publicationLimit: null, // unlimited
    price: 19990, // CLP per month
    features: [
      "Publicaciones ilimitadas",
      "Todas las funciones",
      "Soporte premium 24/7",
      "Analytics completos",
      "Destacar publicaciones premium",
      "API access"
    ],
    icon: "crown", // FontAwesome icon name
    color: "#d97706", // Better contrast amber
    bgColor: "#fefbf3"
  }
};

/**
 * Get publication limit for a given tier
 * @param {string} tier - The account tier
 * @returns {number|null} - Publication limit or null for unlimited
 */
export function getPublicationLimit(tier) {
  return ACCOUNT_TIERS[tier]?.publicationLimit || ACCOUNT_TIERS.free.publicationLimit;
}

/**
 * Check if user can create more publications (NEW LOGIC - counts ALL publications regardless of status)
 * @param {string} tier - User's account tier
 * @param {number} totalCount - Total number of publications (all statuses)
 * @returns {object} - {canCreate: boolean, limit: number|null, remaining: number|null}
 */
export function canCreatePublication(tier, totalCount) {
  const limit = getPublicationLimit(tier);
  
  if (limit === null) {
    // Unlimited
    return {
      canCreate: true,
      limit: null,
      remaining: null,
      isUnlimited: true
    };
  }
  
  const remaining = Math.max(0, limit - totalCount);
  
  return {
    canCreate: remaining > 0,
    limit,
    remaining,
    isUnlimited: false
  };
}

/**
 * DEPRECATED - Old function that only counted active publications
 * Kept for backward compatibility if needed
 * @param {string} tier - User's account tier
 * @param {number} activeCount - Current number of active publications only
 * @returns {object} - {canCreate: boolean, limit: number|null, remaining: number|null}
 */
export function canCreatePublicationOld(tier, activeCount) {
  const limit = getPublicationLimit(tier);
  
  if (limit === null) {
    // Unlimited
    return {
      canCreate: true,
      limit: null,
      remaining: null,
      isUnlimited: true
    };
  }
  
  const remaining = Math.max(0, limit - activeCount);
  
  return {
    canCreate: remaining > 0,
    limit,
    remaining,
    isUnlimited: false
  };
}

/**
 * Check if user's subscription is active
 * @param {object} user - User object with tier information
 * @param {object} currentSubscription - Current active subscription from database (optional)
 * @returns {boolean} - Whether the subscription is active
 */
export function isSubscriptionActive(user, currentSubscription = null) {
  if (user.accountTier === 'free') {
    return true; // Free tier is always active
  }
  
  // If we have a current subscription object, check it
  if (currentSubscription) {
    return currentSubscription.status === 'active' && new Date() <= new Date(currentSubscription.endDate);
  }
  
  // Fallback to legacy user fields for backward compatibility
  // Check Flow.cl subscription status (deprecated fields)
  if (user.subscriptionActive !== undefined) {
    if (!user.subscriptionActive) {
      return false;
    }
    
    // Check if subscription has expired
    if (user.subscriptionEndDate && new Date() > new Date(user.subscriptionEndDate)) {
      return false;
    }
    
    return true;
  }
  
  // If no subscription data available, assume free tier
  return user.accountTier === 'free';
}

/**
 * Get effective account tier (considering subscription status)
 * @param {object} user - User object with tier information
 * @param {object} currentSubscription - Current active subscription from database (optional)
 * @returns {string} - Effective tier ("free" if subscription expired)
 */
export function getEffectiveTier(user, currentSubscription = null) {
  if (!isSubscriptionActive(user, currentSubscription)) {
    return 'free';
  }
  
  // Use subscription planId if available and active
  if (currentSubscription && currentSubscription.status === 'active') {
    return currentSubscription.planId;
  }
  
  // Fallback to legacy fields for backward compatibility
  // Use subscriptionTier if available and active, otherwise fall back to accountTier
  return user.subscriptionTier || user.accountTier;
}

/**
 * Format tier name for display
 * @param {string} tier - The account tier
 * @returns {string} - Formatted tier name
 */
export function formatTierName(tier) {
  return ACCOUNT_TIERS[tier]?.name || ACCOUNT_TIERS.free.name;
}

/**
 * Get tier color for UI display
 * @param {string} tier - The account tier
 * @returns {string} - CSS color class or hex color
 */
export function getTierColor(tier) {
  return ACCOUNT_TIERS[tier]?.color || ACCOUNT_TIERS.free.color;
}

/**
 * Get tier background color for UI display
 * @param {string} tier - The account tier
 * @returns {string} - CSS background color
 */
export function getTierBgColor(tier) {
  return ACCOUNT_TIERS[tier]?.bgColor || ACCOUNT_TIERS.free.bgColor;
}

/**
 * Get tier icon name for FontAwesome
 * @param {string} tier - The account tier
 * @returns {string} - FontAwesome icon name
 */
export function getTierIcon(tier) {
  return ACCOUNT_TIERS[tier]?.icon || ACCOUNT_TIERS.free.icon;
}

// Deprecated - keeping for backward compatibility
export function getTierEmoji(tier) {
  // Return empty string since we're moving away from emojis
  console.warn('getTierEmoji is deprecated, use getTierIcon instead');
  return '';
} 