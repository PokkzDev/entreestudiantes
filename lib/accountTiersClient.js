// Client-side Account tier utilities (browser-safe)

// Cache for account tiers (refreshes every 10 minutes)
let accountTiersCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Fetch account tiers from API with caching
 * @returns {Promise<Array>} - Array of account tier objects
 */
export async function fetchAccountTiers() {
  // Check if cache is still valid
  if (accountTiersCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return accountTiersCache;
  }

  try {
    const response = await fetch('/api/account-tiers');
    const data = await response.json();

    if (data.success && !data.fallback) {
      // Update cache only with real database data
      accountTiersCache = data.tiers;
      cacheTimestamp = Date.now();
      return data.tiers;
    } else {
      throw new Error('Failed to fetch account tiers or fallback data returned');
    }
  } catch (error) {
    console.error('Error fetching account tiers:', error);
    
    // Return cached data if it's from database, otherwise return empty array
    if (accountTiersCache) {
      return accountTiersCache;
    } else {
      // Return empty array instead of fallback data
      return [];
    }
  }
}

/**
 * Get account tiers as an object (legacy format compatibility)
 * @returns {Promise<object>} - Account tiers object keyed by tierKey
 */
export async function getAccountTiersObject() {
  const tiers = await fetchAccountTiers();
  const tiersObject = {};
  
  tiers.forEach(tier => {
    tiersObject[tier.tierKey] = tier;
  });
  
  return tiersObject;
}

/**
 * Get tier property by key
 * @param {string} tierKey - The tier key
 * @param {string} property - The property to get
 * @returns {Promise<any>} - The property value
 */
export async function getTierProperty(tierKey, property) {
  const tiersObject = await getAccountTiersObject();
  return tiersObject[tierKey]?.[property] || tiersObject.free?.[property];
}

/**
 * Get publication limit for a given tier
 * @param {string} tierKey - The account tier
 * @returns {Promise<number|null>} - Publication limit or null for unlimited
 */
export async function getPublicationLimit(tierKey) {
  return await getTierProperty(tierKey, 'publicationLimit');
}

/**
 * Check if user can create more publications
 * @param {string} tierKey - User's account tier
 * @param {number} totalCount - Total number of publications
 * @returns {Promise<object>} - {canCreate: boolean, limit: number|null, remaining: number|null}
 */
export async function canCreatePublication(tierKey, totalCount) {
  const limit = await getPublicationLimit(tierKey);
  
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
 * Get tier color
 * @param {string} tierKey - The account tier
 * @returns {Promise<string>} - Tier color
 */
export async function getTierColor(tierKey) {
  return await getTierProperty(tierKey, 'color');
}

/**
 * Get tier background color
 * @param {string} tierKey - The account tier
 * @returns {Promise<string>} - Tier background color
 */
export async function getTierBgColor(tierKey) {
  return await getTierProperty(tierKey, 'bgColor');
}

/**
 * Get tier icon name
 * @param {string} tierKey - The account tier
 * @returns {Promise<string>} - Tier icon name
 */
export async function getTierIcon(tierKey) {
  return await getTierProperty(tierKey, 'icon');
}

/**
 * Get tier name
 * @param {string} tierKey - The account tier
 * @returns {Promise<string>} - Tier name
 */
export async function getTierName(tierKey) {
  return await getTierProperty(tierKey, 'name');
}

/**
 * Clear the cache
 */
export function clearCache() {
  accountTiersCache = null;
  cacheTimestamp = null;
}

/**
 * Get tier from cache (synchronous)
 * @param {string} tierKey - The tier key
 * @returns {object|null} - Tier object or null
 */
function getCachedTier(tierKey) {
  if (accountTiersCache) {
    return accountTiersCache.find(tier => tier.tierKey === tierKey);
  }
  return null; // Return null instead of fallback data
}

/**
 * Synchronous functions for immediate rendering - return null if no database data available
 */
export function getTierColorSync(tierKey) {
  return getCachedTier(tierKey)?.color || null;
}

export function getTierBgColorSync(tierKey) {
  return getCachedTier(tierKey)?.bgColor || null;
}

export function getTierIconSync(tierKey) {
  return getCachedTier(tierKey)?.icon || null;
}

export function getTierNameSync(tierKey) {
  return getCachedTier(tierKey)?.name || null;
}

export function getPublicationLimitSync(tierKey) {
  const tier = getCachedTier(tierKey);
  return tier ? tier.publicationLimit : null;
}

// Export synchronous format functions for immediate use
export function formatTierName(tierKey) {
  return getTierNameSync(tierKey) || tierKey; // Return tierKey as fallback
} 