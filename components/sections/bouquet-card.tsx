'use client';

import Link from 'next/link';
import { type Bouquet } from '@/types';
import { formatPrice, averageRating } from '@/lib/format';
import { Star, Heart, Clock } from 'lucide-react';
import { useWishlist } from '@/features/wishlist/wishlist-context';
import { useCart } from '@/features/cart/cart-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  const { isWishlisted, toggle } = useWishlist();
  const { addItem } = useCart();
  const wished = isWishlisted(bouquet.id);
  const ratings = bouquet.reviews?.map((r) => r.rating) ?? [];
  const avg = averageRating(ratings);
  const primaryImage = bouquet.images?.[0]?.image_url;

  function handleAdd() {
    addItem({
      type: 'bouquet',
      bouquet_id: bouquet.id,
      name: bouquet.name,
      image_url: primaryImage,
      unit_price_cents: bouquet.price_cents,
      quantity: 1,
    });
    toast.success(`${bouquet.name} added to cart`);
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await toggle(bouquet);
    toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
  }

  return (
    <Link href={`/shop/${bouquet.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft transition-all duration-300 hover:shadow-soft-lg">
        <div className="relative aspect-[4/5] overflow-hidden">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={bouquet.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-rose-50">
              <span className="font-serif text-6xl text-primary/20">F</span>
            </div>
          )}
          {bouquet.is_featured && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-soft">
              Featured
            </span>
          )}
          {bouquet.stock === 0 ? (
            <span className="absolute right-3 top-3 rounded-full bg-gray-500 px-3 py-1 text-xs font-semibold text-white">
              Sold Out
            </span>
          ) : bouquet.stock <= 5 ? (
            <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
              Low Stock
            </span>
          ) : null}
          <button
            onClick={handleWishlist}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft transition-all hover:scale-110 hover:bg-white"
            aria-label="Toggle wishlist"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                wished ? 'fill-primary text-primary' : 'text-muted-foreground'
              )}
            />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold leading-tight text-foreground">
              {bouquet.name}
            </h3>
            {avg > 0 && (
              <div className="flex shrink-0 items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-muted-foreground">
                  {avg.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {bouquet.description}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{bouquet.prep_time_minutes} min prep</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-serif text-xl font-bold text-primary">
              {formatPrice(bouquet.price_cents)}
            </span>
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAdd();
              }}
              disabled={bouquet.stock === 0}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
