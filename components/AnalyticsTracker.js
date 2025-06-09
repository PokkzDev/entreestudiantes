"use client";
import { useEffect } from 'react';
import { usePageTracking } from '../lib/usePageTracking';

export default function AnalyticsTracker() {
  const { enableTracking, disableTracking } = usePageTracking({
    trackOnMount: true,
    trackOnPathChange: true,
    excludePaths: [
      '/api/',           // Don't track API calls
      '/_next/',         // Don't track Next.js internal paths
      '/favicon.ico',    // Don't track favicon requests
    ],
  });

  // Listen for changes in cookie consent
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'analyticsEnabled' || e.key === 'cookieConsent') {
        const analyticsEnabled = localStorage.getItem('analyticsEnabled');
        const cookieConsent = localStorage.getItem('cookieConsent');
        
        if (analyticsEnabled === 'false' || cookieConsent === 'declined') {
          disableTracking();
          // Clear existing analytics data when disabled
          sessionStorage.removeItem('analytics_session_id');
          sessionStorage.removeItem('analytics_session_start');
          localStorage.removeItem('analytics_user_id');
        } else if (analyticsEnabled === 'true' || cookieConsent === 'accepted') {
          enableTracking();
        }
      }
    };

    // Listen for localStorage changes (from cookie consent modal)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for changes within the same tab
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, arguments);
      if (key === 'analyticsEnabled' || key === 'cookieConsent') {
        handleStorageChange({ key, newValue: value });
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, [enableTracking, disableTracking]);

  // This component doesn't render anything visible
  return null;
} 