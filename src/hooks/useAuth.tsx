import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, displayName?: string, referralCode?: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listener FIRST — handles INITIAL_SESSION, TOKEN_REFRESHED, SIGNED_OUT etc.
    // This fires synchronously with the cached session from localStorage,
    // so isLoading is set to false immediately without a network round-trip.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'TOKEN_REFRESHED' && !newSession) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    // Fallback: if onAuthStateChange hasn't fired within 2s (e.g. no cached session),
    // stop loading to prevent infinite spinner.
    const fallbackTimer = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          console.warn('[Auth] Fallback: no auth event after 2s, clearing loading state');
          return false;
        }
        return prev;
      });
    }, 2000);

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string, referralCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
          referral_code: referralCode,
        },
      },
    });

    // If auto-confirm is enabled, a session may be returned immediately.
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user ?? null);
    }

    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // Update state immediately to avoid redirect flicker/races.
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user ?? null);
    }

    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    // Optimistically clear state to keep UI consistent.
    setSession(null);
    setUser(null);
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: !!session,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
    }),
    [user, session, isLoading, signUp, signIn, signOut, resetPassword, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
