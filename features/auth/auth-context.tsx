'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

const ADMIN_EMAIL = 'basulipuja18@gmail.com';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        (async () => {
          setSession(newSession);
          if (newSession) {
            await loadProfile(newSession);
          } else {
            setProfile(null);
            setLoading(false);
          }
        })();
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(session: {
    user: { id: string; email?: string; user_metadata?: { full_name?: string } };
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error.message);
    }

    if (data) {
      setProfile(data as Profile);
    } else {
      const isAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL;
      const fullName =
        session.user.user_metadata?.full_name ??
        session.user.email ??
        'User';
      const newProfile = {
        id: session.user.id,
        full_name: fullName,
        phone: null,
        role: isAdmin ? 'admin' : 'customer',
      };
      const { data: created } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select('*')
        .maybeSingle();
      if (created) setProfile(created as Profile);
    }
    setLoading(false);
  }

  async function refreshProfile() {
    if (session) {
      await loadProfile(session);
    }
  }

  async function signInWithGoogle(): Promise<{ error: string | null }> {
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  const isAdmin =
    session?.user?.email?.toLowerCase() === ADMIN_EMAIL ||
    profile?.role === 'admin';

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
