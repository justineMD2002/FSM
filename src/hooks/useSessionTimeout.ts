import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Auto logout hook that signs the user out 24 hours after they logged in,
 * regardless of activity. Mirrors useAutoClockOut logic.
 */
export const useSessionTimeout = () => {
  const signOut = useAuthStore((state) => state.signOut);
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const performAutoLogout = async () => {
    console.log('Session has exceeded 24 hours. Auto logging out...');
    if (user) {
      await supabase
        .from('users')
        .update({ is_logged_in: false })
        .eq('id', user.id);
    }
    signOut();
  };

  const setupTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!session) return;

    const loginTime = new Date(session.user.created_at).getTime();

    // Supabase session created_at doesn't change on re-login,
    // use the access token issued_at (iat) claim instead
    const iat: number | undefined = (session as any).access_token
      ? JSON.parse(atob(session.access_token.split('.')[1]))?.iat
      : undefined;

    const sessionStart = iat ? iat * 1000 : loginTime;
    const elapsed = Date.now() - sessionStart;
    const remaining = SESSION_DURATION - elapsed;

    if (remaining <= 0) {
      performAutoLogout();
      return;
    }

    timeoutRef.current = setTimeout(() => {
      performAutoLogout();
    }, remaining);
  };

  useEffect(() => {
    if (!session) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    setupTimer();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        // Re-check on foreground resume in case timer was killed
        setupTimer();
      }
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      subscription.remove();
    };
  }, [session]);
};
