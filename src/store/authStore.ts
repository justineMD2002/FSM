import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initialize: () => (() => void);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email: string, password: string) => {
    // Strategy: Sign in, then immediately sign out globally, then sign in again
    // This ensures only ONE active session exists

    // Step 1: Sign in to get access
    const { data: firstSignIn, error: firstError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (firstError) {
      return { error: firstError };
    }

    // Step 2: Sign out from ALL sessions globally
    await supabase.auth.signOut({ scope: 'global' });

    // Step 3: Sign in again to create a fresh single session
    const { error: finalError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: finalError };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  initialize: () => {
    let subscription: any = null;

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      })
      .catch((error) => {
        console.error('Failed to get initial session:', error);
        set({ loading: false });
      });

    // Listen to auth changes
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      });
      subscription = data.subscription;
    } catch (error) {
      console.error('Failed to set up auth listener:', error);
      set({ loading: false });
    }

    // Return cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  },
}));
