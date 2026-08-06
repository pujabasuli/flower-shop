'use client';

import Link from 'next/link';
import { type Bouquet } from '@/types';
import { BouquetCard } from '@/components/sections/bouquet-card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function FeaturedBouquets({ bouquets }: { bouquets: Bouquet[] }) {
  if (bouquets.length === 0) return null;
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Curated Selection
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Featured Bouquets
            </h2>
          </div>
          <Button asChild variant="outline" className="mt-4 sm:mt-0 group">
            <Link href="/shop">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bouquets.slice(0, 4).map((b) => (
            <BouquetCard key={b.id} bouquet={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
