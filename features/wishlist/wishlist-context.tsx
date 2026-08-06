'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/auth-context';
import type { WishlistItem, Bouquet } from '@/types';

interface WishlistContextValue {
  items: WishlistItem[];
  loading: boolean;
  isWishlisted: (bouquetId: string) => boolean;
  toggle: (bouquet: Bouquet) => Promise<void>;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setItems([]);
      return;
    }
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function loadWishlist() {
    if (!session?.user) return;
    setLoading(true);
    const { data } = await supabase
      .from('wishlists')
      .select('*, bouquet:bouquets(*)')
      .eq('user_id', session.user.id);
    setItems((data ?? []) as WishlistItem[]);
    setLoading(false);
  }

  function isWishlisted(bouquetId: string): boolean {
    return items.some((i) => i.bouquet_id === bouquetId);
  }

  async function toggle(bouquet: Bouquet) {
    if (!session?.user) return;
    const existing = items.find((i) => i.bouquet_id === bouquet.id);
    if (existing) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('id', existing.id);
      setItems((prev) => prev.filter((i) => i.id !== existing.id));
    } else {
      const { data } = await supabase
        .from('wishlists')
        .insert({ user_id: session.user.id, bouquet_id: bouquet.id })
        .select('*, bouquet:bouquets(*)')
        .maybeSingle();
      if (data) setItems((prev) => [...prev, data as WishlistItem]);
    }
  }

  const value: WishlistContextValue = {
    items,
    loading,
    isWishlisted,
    toggle,
    count: items.length,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
