'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useWishlist } from '@/features/wishlist/wishlist-context';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { BouquetCard } from '@/components/sections/bouquet-card';
import type { Bouquet } from '@/types';
import { Heart, ShoppingBag } from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { items } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/signin');
    }
  }, [loading, session, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !mounted) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="h-10 w-1/3 rounded shimmer" />
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl shimmer" />
            ))}
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!session) return null;

  const bouquets = items
    .map((i) => i.bouquet)
    .filter((b): b is Bouquet => b !== null && b !== undefined);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            My Wishlist
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {bouquets.length} saved {bouquets.length === 1 ? 'bouquet' : 'bouquets'}
          </p>
        </div>

        {bouquets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-card py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
              <Heart className="h-10 w-10 text-primary/40" />
            </div>
            <div>
              <p className="font-serif text-xl font-medium">
                Your wishlist is empty
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Save your favorite bouquets by tapping the heart icon.
              </p>
            </div>
            <Button asChild>
              <Link href="/shop">Browse Bouquets</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bouquets.map((b) => (
              <BouquetCard key={b.id} bouquet={b} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
