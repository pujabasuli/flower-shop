'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type Bouquet, type Review } from '@/types';
import { ProductGallery, QuantitySelector, ProductInfo } from '@/components/sections/product-gallery';
import { BouquetCard } from '@/components/sections/bouquet-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingBag, Star, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { formatPrice, averageRating } from '@/lib/format';
import { useCart } from '@/features/cart/cart-context';
import { useWishlist } from '@/features/wishlist/wishlist-context';
import { useAuth } from '@/features/auth/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ProductDetail({
  bouquet,
  related,
}: {
  bouquet: Bouquet & { reviews: Review[] };
  related: Bouquet[];
}) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { session } = useAuth();
  const wished = isWishlisted(bouquet.id);
  const ratings = bouquet.reviews?.map((r) => r.rating) ?? [];
  const avg = averageRating(ratings);

  function handleAdd() {
    addItem({
      type: 'bouquet',
      bouquet_id: bouquet.id,
      name: bouquet.name,
      image_url: bouquet.images?.[0]?.image_url,
      unit_price_cents: bouquet.price_cents,
      quantity,
    });
    toast.success(`${bouquet.name} added to cart`);
  }

  async function handleWishlist() {
    if (!session) {
      toast.error('Please sign in to save to wishlist');
      return;
    }
    await toggle(bouquet);
    toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{bouquet.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={bouquet.images ?? []} name={bouquet.name} />

        <div className="space-y-6">
          <div>
            {bouquet.category && (
              <Badge variant="secondary" className="mb-2">
                {bouquet.category.name}
              </Badge>
            )}
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              {bouquet.name}
            </h1>
            {avg > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.round(avg)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {avg.toFixed(1)} ({bouquet.reviews?.length ?? 0} reviews)
                </span>
              </div>
            )}
          </div>

          <p className="text-2xl font-bold text-primary">
            {formatPrice(bouquet.price_cents)}
          </p>

          <p className="text-base leading-relaxed text-muted-foreground">
            {bouquet.description}
          </p>

          <ProductInfo bouquet={bouquet} />

          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/40 bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Quantity:</span>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                max={Math.max(1, bouquet.stock)}
              />
            </div>
            <div className="flex flex-1 items-center gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={handleWishlist}
                aria-label="Toggle wishlist"
              >
                <Heart className={cn('h-5 w-5', wished && 'fill-primary text-primary')} />
              </Button>
              <Button
                size="lg"
                onClick={handleAdd}
                disabled={bouquet.stock === 0}
                className="flex-1 sm:flex-none"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-sage-50 p-4 text-sm text-sage-600">
            <Clock className="h-4 w-4" />
            <span>
              Ready in {bouquet.prep_time_minutes} minutes after order confirmation
            </span>
          </div>
        </div>
      </div>

      <ReviewsSection bouquetId={bouquet.id} reviews={bouquet.reviews ?? []} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((b) => (
              <BouquetCard key={b.id} bouquet={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewsSection({
  bouquetId,
  reviews,
}: {
  bouquetId: string;
  reviews: Review[];
}) {
  const { session } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  async function submitReview() {
    if (!session) {
      toast.error('Please sign in to leave a review');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    setSubmitting(true);
    const { data, error } = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bouquetId, rating, comment }),
    }).then((r) => r.json());

    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (data) {
      setLocalReviews([data, ...localReviews]);
      setComment('');
      setRating(5);
      setShowForm(false);
      toast.success('Review submitted!');
    }
  }

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
          Customer Reviews
        </h2>
        {session && (
          <Button variant="outline" onClick={() => setShowForm(!showForm)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-border/40 bg-card p-6">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Rating</label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRating(i + 1)}>
                  <Star
                    className={cn(
                      'h-6 w-6 transition-colors',
                      i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              rows={4}
              placeholder="Share your experience..."
            />
          </div>
          <Button onClick={submitReview} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      )}

      {localReviews.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {localReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-border/40 bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-rose-300 font-serif text-sm font-bold text-white">
                    {(review.profile?.full_name ?? 'A')[0]}
                  </div>
                  <div>
                    <p className="font-serif text-sm font-semibold">
                      {review.profile?.full_name ?? 'Anonymous'}
                    </p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3 w-3',
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
