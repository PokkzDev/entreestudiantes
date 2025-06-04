// Server-side Account tier definitions and utilities
// Note: This file should only be used in server-side contexts (API routes, server components)
// For client-side usage, use /lib/accountTiersClient.js

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
 * Server-side function to get publication limit using database tier data
 * This function should receive tier data that was fetched from the database
 * @param {string} tierKey - The account tier key
 * @param {object} tierData - The tier data object from database
 * @returns {number|null} - Publication limit or null for unlimited
 */
export function getPublicationLimitFromTierData(tierKey, tierData) {
  if (!tierData) return null; // Return null if no tier data
  return tierData.publicationLimit;
}

/**
 * Server-side function to check if user can create more publications
 * @param {string} tierKey - User's account tier
 * @param {number} totalCount - Total number of publications (all statuses)
 * @param {object} tierData - The tier data object from database
 * @returns {object} - {canCreate: boolean, limit: number|null, remaining: number|null}
 */
export function canCreatePublicationFromTierData(tierKey, totalCount, tierData) {
  const limit = getPublicationLimitFromTierData(tierKey, tierData);
  
  if (limit === null) {
    // Unlimited or no tier data
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
 * @param {string} tierKey - User's account tier
 * @param {number} activeCount - Current number of active publications only
 * @param {object} tierData - The tier data object from database
 * @returns {object} - {canCreate: boolean, limit: number|null, remaining: number|null}
 */
export function canCreatePublicationOldFromTierData(tierKey, activeCount, tierData) {
  const limit = getPublicationLimitFromTierData(tierKey, tierData);
  
  if (limit === null) {
    // Unlimited or no tier data
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

// Note: All legacy functions that used fallback data have been removed.
// Use only functions that accept tierData parameter from database queries. 