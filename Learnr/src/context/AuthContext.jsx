import { createContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => {
    const accessToken = session?.access_token ?? null;

    return {
      isSupabaseConfigured,
      loading,
      session,
      user,
      accessToken,
      isAuthenticated: Boolean(user),
      signUpWithPassword: async (email, password) => {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      signInWithPassword: async (email, password) => {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signInWithGoogle: async () => {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      },
      sendMagicLink: async (email) => {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      },
      resetPassword: async (email) => {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
      },
      updatePassword: async (newPassword) => {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      },
      verifyOtp: async (email, token) => {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'magiclink',
        });
        if (error) throw error;
      },
      signOut: async () => {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    };
  }, [loading, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
