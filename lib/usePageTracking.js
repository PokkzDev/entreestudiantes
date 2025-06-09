import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { isAnalyticsEnabled } from './cookieConsent';

// Global session storage for tracking
let analyticsSessionId = null;
let analyticsUserId = null;
let trackingQueue = [];
let isTracking = false;

// Note: isAnalyticsEnabled is now imported from cookieConsent.js

// Get or create persistent user ID (survives browser sessions)
function getAnalyticsUserId() {
  if (typeof window === 'undefined') return null;
  
  // Don't create user ID if analytics are disabled
  if (!isAnalyticsEnabled()) return null;
  
  if (!analyticsUserId) {
    // Try to get from localStorage first (persistent across sessions)
    analyticsUserId = localStorage.getItem('analytics_user_id');
    
    // If not found, generate new one
    if (!analyticsUserId) {
      analyticsUserId = crypto.randomUUID();
      localStorage.setItem('analytics_user_id', analyticsUserId);
    }
  }
  
  return analyticsUserId;
}

// Get or create analytics session ID (per browser tab/session)
function getAnalyticsSessionId() {
  if (typeof window === 'undefined') return null;
  
  // Don't create session ID if analytics are disabled
  if (!isAnalyticsEnabled()) return null;
  
  if (!analyticsSessionId) {
    // Try to get from sessionStorage first
    analyticsSessionId = sessionStorage.getItem('analytics_session_id');
    
    // If not found, generate new one
    if (!analyticsSessionId) {
      analyticsSessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', analyticsSessionId);
    }
  }
  
  return analyticsSessionId;
}

// Batch tracking function to avoid overwhelming the server
async function processTrackingQueue() {
  if (isTracking || trackingQueue.length === 0) return;
  
  isTracking = true;
  const itemsToProcess = [...trackingQueue];
  trackingQueue = [];
  
  try {
    // Process items in parallel but limit concurrent requests
    const batchSize = 3;
    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      const batch = itemsToProcess.slice(i, i + batchSize);
      await Promise.all(
        batch.map(item => 
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          }).catch(error => {
            console.debug('Analytics tracking failed:', error);
            // Fail silently - analytics shouldn't break the app
          })
        )
      );
    }
  } catch (error) {
    console.debug('Batch analytics processing failed:', error);
  } finally {
    isTracking = false;
  }
}

// Queue a tracking event
function queueTracking(data) {
  if (typeof window === 'undefined') return;
  
  // Don't track if analytics are disabled
  if (!isAnalyticsEnabled()) return;
  
  const sessionId = getAnalyticsSessionId();
  const userId = getAnalyticsUserId();
  if (!sessionId || !userId) return;
  
  trackingQueue.push({
    ...data,
    sessionId,
    analyticsUserId: userId, // Persistent user ID
    timestamp: new Date().toISOString(),
  });
  
  // Process queue with a small delay to allow for batching
  setTimeout(processTrackingQueue, 100);
}

// Custom hook for page tracking
export function usePageTracking(options = {}) {
  const pathname = usePathname();
  const lastTrackedPath = useRef(null);
  const trackingEnabled = useRef(true);
  
  const {
    trackOnMount = true,
    trackOnPathChange = true,
    excludePaths = [],
    customData = {},
  } = options;
  
  // Function to manually track a page view
  const trackPageView = useCallback((customPath = null, additionalData = {}) => {
    if (!trackingEnabled.current) return;
    if (!isAnalyticsEnabled()) return;
    
    const pathToTrack = customPath || pathname;
    
    // Skip if path is in exclude list
    if (excludePaths.some(excluded => pathToTrack.startsWith(excluded))) {
      return;
    }
    
    // Skip if same path was just tracked (prevent double tracking)
    if (pathToTrack === lastTrackedPath.current && !customPath) {
      return;
    }
    
    lastTrackedPath.current = pathToTrack;
    
    const trackingData = {
      path: pathToTrack,
      referer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...customData,
      ...additionalData,
    };
    
    queueTracking(trackingData);
  }, [pathname, excludePaths, customData]);
  
  // Track on path changes
  useEffect(() => {
    if (!trackOnPathChange || !pathname) return;
    if (!isAnalyticsEnabled()) return;
    
    trackPageView();
  }, [pathname, trackOnPathChange, trackPageView]);
  
  // Track on component mount
  useEffect(() => {
    if (!trackOnMount) return;
    if (!isAnalyticsEnabled()) return;
    
    trackPageView();
  }, [trackOnMount, trackPageView]);
  
  // Function to disable tracking (useful for admin pages, etc.)
  const disableTracking = () => {
    trackingEnabled.current = false;
  };
  
  // Function to enable tracking
  const enableTracking = () => {
    trackingEnabled.current = true;
  };
  
  // Function to track custom events
  const trackEvent = useCallback((eventData) => {
    if (!trackingEnabled.current) return;
    if (!isAnalyticsEnabled()) return;
    
    queueTracking({
      path: pathname,
      ...eventData,
    });
  }, [pathname]);
  
  return {
    trackPageView,
    trackEvent,
    disableTracking,
    enableTracking,
    sessionId: getAnalyticsSessionId(),
    userId: getAnalyticsUserId(),
  };
}

// Hook specifically for tracking publication views
export function usePublicationTracking(publicationId) {
  const { trackEvent } = usePageTracking();
  
  const trackPublicationView = useCallback((additionalData = {}) => {
    trackEvent({
      eventType: 'publication_view',
      publicationId,
      ...additionalData,
    });
  }, [trackEvent, publicationId]);
  
  const trackPublicationContact = useCallback((contactMethod) => {
    trackEvent({
      eventType: 'publication_contact',
      publicationId,
      contactMethod,
    });
  }, [trackEvent, publicationId]);
  
  const trackPublicationFavorite = useCallback((action) => {
    trackEvent({
      eventType: 'publication_favorite',
      publicationId,
      action, // 'add' or 'remove'
    });
  }, [trackEvent, publicationId]);
  
  const trackPublicationShare = useCallback(() => {
    trackEvent({
      eventType: 'publication_share',
      publicationId,
    });
  }, [trackEvent, publicationId]);
  
  return {
    trackPublicationView,
    trackPublicationContact,
    trackPublicationFavorite,
    trackPublicationShare,
  };
}

// Hook for tracking search behavior
export function useSearchTracking() {
  const { trackEvent } = usePageTracking();
  
  const trackSearch = (query, filters = {}, resultCount = 0) => {
    trackEvent({
      eventType: 'search',
      searchQuery: query,
      searchFilters: filters,
      resultCount,
    });
  };
  
  const trackSearchResultClick = (publicationId, position) => {
    trackEvent({
      eventType: 'search_result_click',
      publicationId,
      resultPosition: position,
    });
  };
  
  return {
    trackSearch,
    trackSearchResultClick,
  };
}

// Utility function to get analytics session info
export function getAnalyticsSession() {
  return {
    sessionId: getAnalyticsSessionId(),
    userId: getAnalyticsUserId(),
    startTime: sessionStorage.getItem('analytics_session_start') || new Date().toISOString(),
  };
}

// Initialize session tracking when module loads
if (typeof window !== 'undefined') {
  // Set session start time if not already set
  if (!sessionStorage.getItem('analytics_session_start')) {
    sessionStorage.setItem('analytics_session_start', new Date().toISOString());
  }
  
  // Clear session data on tab close (optional)
  window.addEventListener('beforeunload', () => {
    // Only process tracking queue if analytics are enabled
    if (isAnalyticsEnabled() && trackingQueue.length > 0) {
      // Use sendBeacon for reliability on page unload
      const sessionId = getAnalyticsSessionId();
      const userId = getAnalyticsUserId();
      trackingQueue.forEach(item => {
        const data = JSON.stringify({ ...item, sessionId, analyticsUserId: userId });
        navigator.sendBeacon('/api/analytics/track', data);
      });
    }
  });
} 