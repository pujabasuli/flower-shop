'use client';

import Link from 'next/link';
import { type Category } from '@/types';

export function CategoriesSection({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="bg-gradient-to-b from-cream-50 to-rose-50/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Browse by Style
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Shop by Category
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg"
            >
              <div className="aspect-square overflow-hidden">
                {cat.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-rose-50">
                    <span className="font-serif text-4xl text-primary/20">
                      {cat.name[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 w-full p-3 text-center">
                <h3 className="font-serif text-base font-semibold text-white drop-shadow-sm sm:text-lg">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
