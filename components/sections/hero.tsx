'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-cream-50 to-sage-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-sage-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cream-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:flex-row lg:px-8 lg:py-32 lg:text-left">
        <div className="max-w-2xl animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/60 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Handcrafted with fresh, seasonal blooms
          </div>
          <h1 className="mt-6 font-serif text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Flowers that <span className="gradient-text">whisper</span> what words cannot
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Artisan bouquets crafted by hand for every occasion. Order online,
            pick up in store, and let every petal tell your story.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="group">
              <Link href="/shop">
                Shop Bouquets
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/custom-bouquet">Build Your Own</Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-8 lg:justify-start">
            <div>
              <p className="font-serif text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Happy Customers</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="font-serif text-3xl font-bold text-primary">50+</p>
              <p className="text-sm text-muted-foreground">Unique Bouquets</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="font-serif text-3xl font-bold text-primary">4.9</p>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        </div>

        <div className="relative mt-12 lg:mt-0 lg:ml-12 lg:flex-1">
          <div className="relative mx-auto max-w-md lg:max-w-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/30891127/pexels-photo-30891127.jpeg?auto=compress&cs=tinysrgb&h=800&w=600"
              alt="Beautiful pink rose bouquet"
              className="animate-float rounded-[2rem] object-cover shadow-soft-lg"
            />
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-4 shadow-soft-lg sm:block">
              <p className="font-serif text-sm font-semibold">Same-Day Prep</p>
              <p className="text-xs text-muted-foreground">Order by 2 PM</p>
            </div>
            <div className="absolute -right-4 top-8 hidden rounded-2xl bg-white p-4 shadow-soft-lg sm:block">
              <p className="font-serif text-sm font-semibold">Fresh Daily</p>
              <p className="text-xs text-muted-foreground">Locally sourced</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
