import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Custom hook for real-time session validation
 * Checks if user has been banned/suspended and logs them out automatically
 * @param {number} intervalMs - How often to check (default: 30 seconds)
 */
export function useSessionValidation(intervalMs = 30000) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const intervalRef = useRef(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Only start validation if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check if we're on the login page with a suspension flag
    // This means the middleware already handled the logout
    const currentPath = window.location.pathname;
    const isSuspended = searchParams?.get('suspended') === 'true';
    if (currentPath === '/login' && isSuspended) {
      // Don't start session validation if we're already on login due to suspension
      return;
    }

    const checkSessionValidity = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const response = await fetch('/api/check-session', {
          method: 'GET',
          credentials: 'include'
        });

        const data = await response.json();

        if (!data.valid && data.shouldLogout) {
          // Clear the interval before logging out
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Show a brief message before logging out
          console.warn('Session invalidated:', data.reason);
          
          // Create a clean login URL with the reason as a message
          const loginUrl = `/login?message=${encodeURIComponent(data.reason)}`;
          
          // Log out the user and redirect to clean login page
          await signOut({ 
            callbackUrl: loginUrl,
            redirect: false // Don't auto-redirect, we'll handle it manually
          });
          
          // Manually redirect to avoid NextAuth redirect loops
          window.location.href = loginUrl;
        }
      } catch (error) {
        console.error('Error checking session validity:', error);
        // Don't log out on network errors, just log the error
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Start the interval
    intervalRef.current = setInterval(checkSessionValidity, intervalMs);

    // Also check immediately
    checkSessionValidity();

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session?.user?.id, status, intervalMs, router, searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

export default useSessionValidation; 