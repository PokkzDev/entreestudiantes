/**
 * Cookie consent utilities
 * Centralized functions to check and manage cookie consent
 */

/**
 * Check if analytics cookies are enabled
 * @returns {boolean} True if analytics are enabled
 */
export function isAnalyticsEnabled() {
  if (typeof window === 'undefined') return false;
  
  const analyticsEnabled = localStorage.getItem('analyticsEnabled');
  const cookieConsent = localStorage.getItem('cookieConsent');
  
  // If user explicitly declined, don't track
  if (analyticsEnabled === 'false' || cookieConsent === 'declined') {
    return false;
  }
  
  // If user accepted, enable tracking
  if (analyticsEnabled === 'true' || cookieConsent === 'accepted') {
    return true;
  }
  
  // Default to disabled if no consent given
  return false;
}

/**
 * Check if user has made a cookie consent choice
 * @returns {boolean} True if user has made a choice
 */
export function hasUserMadeCookieChoice() {
  if (typeof window === 'undefined') return false;
  
  const cookieConsent = localStorage.getItem('cookieConsent');
  return cookieConsent === 'accepted' || cookieConsent === 'declined';
}

/**
 * Get the user's cookie consent status
 * @returns {'accepted'|'declined'|'pending'} The consent status
 */
export function getCookieConsentStatus() {
  if (typeof window === 'undefined') return 'pending';
  
  const cookieConsent = localStorage.getItem('cookieConsent');
  if (cookieConsent === 'accepted') return 'accepted';
  if (cookieConsent === 'declined') return 'declined';
  return 'pending';
}

/**
 * Clear all analytics data when user declines cookies
 */
export function clearAnalyticsData() {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem('analytics_session_id');
  sessionStorage.removeItem('analytics_session_start');
  localStorage.removeItem('analytics_user_id'); // Clear persistent user ID
}

/**
 * Set cookie consent programmatically
 * @param {'accepted'|'declined'} status - The consent status
 */
export function setCookieConsent(status) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('cookieConsent', status);
  localStorage.setItem('analyticsEnabled', status === 'accepted' ? 'true' : 'false');
  
  if (status === 'declined') {
    clearAnalyticsData();
  }
  
  // Trigger storage event for components to react
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'analyticsEnabled',
    newValue: status === 'accepted' ? 'true' : 'false'
  }));
}

/**
 * Hook to listen for cookie consent changes
 * @param {Function} callback - Callback function to call when consent changes
 */
export function onCookieConsentChange(callback) {
  if (typeof window === 'undefined') return () => {};
  
  const handleStorageChange = (e) => {
    if (e.key === 'analyticsEnabled' || e.key === 'cookieConsent') {
      callback(isAnalyticsEnabled(), getCookieConsentStatus());
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
} 