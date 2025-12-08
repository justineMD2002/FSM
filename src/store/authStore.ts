import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isCheckingDevice: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setIsCheckingDevice: (checking: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initialize: () => (() => void);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isCheckingDevice: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setIsCheckingDevice: (checking) => set({ isCheckingDevice: checking }),

  signIn: async (email: string, password: string) => {
    set({ isCheckingDevice: true });

    try {
      // First, check if user is already logged in on another device BEFORE signing in
      const { data: userData, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', email)
        .eq('is_logged_in', true)
        .maybeSingle();

      if (checkError) {
        set({ isCheckingDevice: false });
        return { error: checkError };
      }

      // If a record exists, it means the user is already logged in - block login
      if (userData) {
        set({ isCheckingDevice: false });
        return {
          error: {
            message: 'This account is already logged in on another device. Please log out from the other device first before logging in here.',
            code: 'ALREADY_LOGGED_IN'
          }
        };
      }

      // Now validate credentials and sign in
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isCheckingDevice: false });
        return { error };
      }

      // Update is_logged_in to true
      if (data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_logged_in: true })
          .eq('username', email);

        if (updateError) {
          console.error('Failed to update login status:', updateError);
        } else {
          console.log('Successfully updated login status for:', email);
        }
      }

      // Manually update auth state after successful device check
      set({
        isCheckingDevice: false,
        session: data.session,
        user: data.user,
        loading: false
      });

      return { error };
    } catch (err) {
      set({ isCheckingDevice: false });
      throw err;
    }
  },

  signOut: async () => {
    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Update is_logged_in to false
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_logged_in: false })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update logout status:', updateError);
      }
    }

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
        // Don't update auth state if we're checking device login
        if (!get().isCheckingDevice) {
          set({
            session,
            user: session?.user ?? null,
            loading: false,
          });
        }
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