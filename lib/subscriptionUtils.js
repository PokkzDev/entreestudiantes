import { useSession } from 'next-auth/react';
import { ACCOUNT_TIERS } from './accountTiers';

/**
 * Custom hook to get subscription information from the session
 * @returns {Object} Subscription data and utility functions
 */
export function useSubscription() {
  const { data: session, status, update } = useSession();
  
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  
  // Extract subscription data from session
  const subscriptionData = {
    accountTier: session?.user?.accountTier || 'free',
    effectiveAccountTier: session?.user?.effectiveAccountTier || 'free',
    subscriptionStatus: session?.user?.subscriptionStatus || 'inactive',
    subscriptionEndDate: session?.user?.subscriptionEndDate,
    currentSubscription: session?.user?.currentSubscription,
    isActive: session?.user?.subscriptionStatus === 'active',
    isExpired: session?.user?.subscriptionEndDate ? 
      new Date() > new Date(session.user.subscriptionEndDate) : false
  };
  
  // Get tier information
  const currentTier = ACCOUNT_TIERS[subscriptionData.effectiveAccountTier];
  const originalTier = ACCOUNT_TIERS[subscriptionData.accountTier];
  
  // Utility functions
  const refreshSubscription = async () => {
    try {
      await update(); // This will trigger the JWT callback to fetch fresh data
      return { success: true };
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      return { success: false, error: error.message };
    }
  };
  
  const hasFeature = (feature) => {
    return currentTier?.features?.includes(feature) || false;
  };
  
  const canCreatePublication = (currentCount) => {
    const limit = currentTier?.publicationLimit;
    
    if (limit === null) {
      return {
        canCreate: true,
        limit: null,
        remaining: null,
        isUnlimited: true
      };
    }
    
    const remaining = Math.max(0, limit - currentCount);
    
    return {
      canCreate: remaining > 0,
      limit,
      remaining,
      isUnlimited: false
    };
  };
  
  return {
    // Status
    isLoading,
    isAuthenticated,
    
    // Subscription data
    ...subscriptionData,
    
    // Tier information
    currentTier,
    originalTier,
    
    // Utility functions
    refreshSubscription,
    hasFeature,
    canCreatePublication
  };
}

/**
 * Get subscription status for a given user object
 * @param {Object} user - User object with subscription data
 * @returns {Object} Subscription status information
 */
export function getSubscriptionStatus(user) {
  if (!user) {
    return {
      effectiveAccountTier: 'free',
      isActive: false,
      isExpired: false,
      daysUntilExpiry: null
    };
  }
  
  const effectiveAccountTier = user.effectiveAccountTier || user.accountTier || 'free';
  const isActive = user.subscriptionStatus === 'active';
  const subscriptionEndDate = user.subscriptionEndDate;
  
  let isExpired = false;
  let daysUntilExpiry = null;
  
  if (subscriptionEndDate) {
    const endDate = new Date(subscriptionEndDate);
    const now = new Date();
    isExpired = now > endDate;
    
    if (!isExpired) {
      const timeDiff = endDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
  }
  
  return {
    effectiveAccountTier,
    isActive: isActive && !isExpired,
    isExpired,
    daysUntilExpiry,
    subscriptionEndDate
  };
}

/**
 * Check if a plan is an upgrade from the current plan
 * @param {string} currentTier - Current account tier
 * @param {string} targetTier - Target account tier
 * @returns {boolean} Whether the target tier is an upgrade
 */
export function isUpgrade(currentTier, targetTier) {
  const tierOrder = ['free', 'basic', 'premium', 'elite'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const targetIndex = tierOrder.indexOf(targetTier);
  
  return targetIndex > currentIndex;
}

/**
 * Format subscription end date for display
 * @param {string|Date} endDate - Subscription end date
 * @returns {string} Formatted date string
 */
export function formatSubscriptionEndDate(endDate) {
  if (!endDate) return '';
  
  const date = new Date(endDate);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get subscription warning message if subscription is expiring soon
 * @param {Object} subscriptionStatus - Subscription status from getSubscriptionStatus
 * @returns {string|null} Warning message or null
 */
export function getSubscriptionWarning(subscriptionStatus) {
  const { isActive, daysUntilExpiry, isExpired } = subscriptionStatus;
  
  if (isExpired) {
    return 'Tu suscripción ha expirado. Renueva para continuar usando las funciones premium.';
  }
  
  if (isActive && daysUntilExpiry !== null) {
    if (daysUntilExpiry <= 3) {
      return `Tu suscripción expira en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? '' : 's'}. Considera renovar pronto.`;
    }
    
    if (daysUntilExpiry <= 7) {
      return `Tu suscripción expira en ${daysUntilExpiry} días.`;
    }
  }
  
  return null;
} 