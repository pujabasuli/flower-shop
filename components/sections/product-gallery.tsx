'use client';

import { useState } from 'react';
import { type Bouquet } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ProductGallery({ images, name }: { images: { image_url: string }[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const allImages = images.map((i) => i.image_url);

  if (allImages.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-rose-50">
        <span className="font-serif text-8xl text-primary/20">F</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/40 shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={allImages[activeIndex]}
          alt={name}
          className="aspect-square w-full object-cover"
        />
      </div>
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {allImages.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'overflow-hidden rounded-lg border-2 transition-all',
                i === activeIndex
                  ? 'border-primary shadow-soft'
                  : 'border-transparent hover:border-border'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${name} ${i + 1}`} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuantitySelector({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >
        −
      </Button>
      <span className="w-12 text-center font-semibold">{value}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        +
      </Button>
    </div>
  );
}

export function ProductInfo({ bouquet }: { bouquet: Bouquet }) {
  return (
    <div className="space-y-3">
      {bouquet.flowers_included && (
        <div>
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Flowers Included
          </h3>
          <p className="mt-1 text-sm text-foreground">{bouquet.flowers_included}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="font-semibold">Preparation Time:</span>{' '}
          <span className="text-muted-foreground">{bouquet.prep_time_minutes} minutes</span>
        </div>
        <div>
          <span className="font-semibold">Availability:</span>{' '}
          <span className={bouquet.stock > 0 ? 'text-green-600' : 'text-red-500'}>
            {bouquet.stock > 0 ? `${bouquet.stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>
    </div>
  );
}
