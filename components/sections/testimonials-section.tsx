'use client';

import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Bride',
    rating: 5,
    text: 'The Eternal White Vows bouquet was absolutely stunning on my wedding day. Every detail was perfect, and the flowers lasted beautifully throughout the entire celebration.',
    avatar: 'PS',
  },
  {
    name: 'Arjun Mehta',
    role: 'Anniversary Gift',
    rating: 5,
    text: 'I ordered the Crimson Romance for our anniversary and my wife was speechless. The roses were fresh, the arrangement was elegant, and pickup was effortless.',
    avatar: 'AM',
  },
  {
    name: 'Sneha Reddy',
    role: 'Birthday Surprise',
    rating: 5,
    text: 'The custom bouquet builder let me create something truly unique for my mother\'s birthday. Being able to choose every flower and add a handwritten card made it so special.',
    avatar: 'SR',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-rose-50/30 to-cream-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Kind Words
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by Our Customers
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="relative rounded-2xl border border-border/40 bg-card p-6 shadow-soft"
            >
              <Quote className="absolute right-4 top-4 h-10 w-10 text-primary/10" />
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-rose-300 font-serif text-sm font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-serif text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
