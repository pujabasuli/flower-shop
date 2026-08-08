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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null }>;
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

  async function loadProfile(session: { user: { id: string; email?: string } }) {
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
      // New user - create profile from auth metadata
      const isAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL;
      const newProfile = {
        id: session.user.id,
        full_name: session.user.email ?? 'User',
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

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role: isAdmin ? 'admin' : 'customer',
      });
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
    signIn,
    signUp,
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
