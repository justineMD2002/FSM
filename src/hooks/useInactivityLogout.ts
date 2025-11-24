import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store';

/**
 * Custom hook to automatically logout user after a period of inactivity
 * @param inactivityTimeout - Timeout in milliseconds (default: 5 minutes)
 */
export const useInactivityLogout = (inactivityTimeout: number = 5 * 60 * 1000) => {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastActiveTimeRef = useRef<number>(Date.now());

  // Reset the inactivity timer
  const resetTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last active time
    lastActiveTimeRef.current = Date.now();

    // Only set new timeout if user is logged in
    if (user) {
      timeoutRef.current = setTimeout(() => {
        console.log('User has been inactive for 5 minutes. Logging out...');
        signOut();
      }, inactivityTimeout);
    }
  };

  useEffect(() => {
    // Only activate if user is logged in
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Initialize the timer
    resetTimer();

    // Handle app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // App coming to foreground from background
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        const inactiveTime = Date.now() - lastActiveTimeRef.current;

        // If inactive time exceeds timeout, logout immediately
        if (inactiveTime >= inactivityTimeout) {
          console.log('App was in background for too long. Logging out...');
          signOut();
        } else {
          // Otherwise, reset the timer
          resetTimer();
        }
      }

      // App going to background - pause timer but track time
      if (nextAppState.match(/inactive|background/)) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.remove();
    };
  }, [user, inactivityTimeout, signOut]);

  // Return resetTimer so it can be called on user activity
  return { resetTimer };
};
