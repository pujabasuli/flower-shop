'use client';

import { Leaf, Truck, Heart, Award } from 'lucide-react';

const FEATURES = [
  {
    icon: Leaf,
    title: 'Fresh & Local',
    description: 'Sourced daily from local growers for maximum freshness and longevity.',
  },
  {
    icon: Truck,
    title: 'Easy Pickup',
    description: 'Order online and pick up at your convenience with flexible time slots.',
  },
  {
    icon: Heart,
    title: 'Made with Love',
    description: 'Every bouquet is hand-arranged by our skilled floral artisans.',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Only the finest blooms make it into our arrangements, guaranteed.',
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-soft-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.pexels.com/photos/6955468/pexels-photo-6955468.jpeg?auto=compress&cs=tinysrgb&h=600&w=800"
                alt="Florist arranging flowers"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 hidden rounded-2xl bg-white p-6 shadow-soft-lg sm:block">
              <p className="font-serif text-4xl font-bold text-primary">10+</p>
              <p className="text-sm text-muted-foreground">Years of Craft</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Our Story
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Where every bloom tells a story
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              At Fleur & Bloom, we believe flowers are more than gifts — they are
              moments frozen in petals. For over a decade, our artisans have been
              crafting arrangements that capture emotions, celebrate milestones,
              and bring joy to everyday life.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold">
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
