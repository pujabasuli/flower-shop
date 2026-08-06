'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/cart-context';
import { useAuth } from '@/features/auth/auth-context';
import { supabase } from '@/lib/supabase';
import type { PickupSlot, Coupon } from '@/types';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingBag, CreditCard, Calendar, Clock, Tag, CheckCircle2 } from 'lucide-react';
import { formatPrice, calculateAdvance, calculateRemaining, generateOrderNumber } from '@/lib/format';
import { ADVANCE_PERCENTAGES, DEFAULT_ADVANCE_PERCENT } from '@/lib/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalCents, clearCart } = useCart();
  const { session, profile } = useAuth();
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [advancePercent, setAdvancePercent] = useState(DEFAULT_ADVANCE_PERCENT);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    supabase
      .from('pickup_slots')
      .select('*')
      .eq('is_active', true)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('start_time')
      .then(({ data }) => setSlots((data ?? []) as PickupSlot[]));
  }, []);

  const availableTimes = slots.filter((s) => s.date === pickupDate);

  const discountCents = appliedCoupon
    ? Math.round((totalCents * appliedCoupon.discount_percent) / 100)
    : 0;
  const finalTotal = totalCents - discountCents;
  const advanceAmount = calculateAdvance(finalTotal, advancePercent);
  const remainingAmount = calculateRemaining(finalTotal, advanceAmount);

  async function applyCoupon() {
    setCouponError('');
    if (!couponCode.trim()) return;
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setCouponError('Invalid or expired coupon code');
      setAppliedCoupon(null);
      return;
    }
    const coupon = data as Coupon;
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      setCouponError('This coupon has expired');
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(coupon);
    toast.success(`Coupon applied: ${coupon.discount_percent}% off!`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!session) {
      toast.error('Please sign in to place an order');
      router.push('/signin');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!pickupDate || !pickupTime) {
      toast.error('Please select a pickup date and time');
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: session.user.id,
          status: 'received',
          subtotal_cents: totalCents,
          discount_cents: discountCents,
          total_cents: finalTotal,
          advance_percent: advancePercent,
          advance_paid_cents: 0,
          remaining_cents: finalTotal,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          special_instructions: instructions || null,
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          coupon_code: appliedCoupon?.code ?? null,
        })
        .select()
        .maybeSingle();

      if (orderError || !order) {
        toast.error('Failed to create order. Please try again.');
        setSubmitting(false);
        return;
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        bouquet_id: item.type === 'bouquet' ? item.bouquet_id : null,
        custom_bouquet_id: null,
        name: item.name,
        image_url: item.image_url ?? null,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        total_price_cents: item.unit_price_cents * item.quantity,
        metadata: item.type === 'custom' ? { custom_bouquet: item.custom_bouquet } : {},
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Failed to create order items:', itemsError.message);
      }

      await supabase.from('payments').insert({
        order_id: order.id,
        amount_cents: advanceAmount,
        type: 'advance',
        status: 'pending',
      });

      await supabase.from('notifications').insert({
        user_id: session.user.id,
        order_id: order.id,
        channel: 'in_app',
        subject: 'Order Received',
        message: `Your order ${orderNumber} has been received. We'll confirm it shortly!`,
        status: 'sent',
      });

      clearCart();
      toast.success(`Order placed! Your order number is ${orderNumber}`);
      router.push(`/orders/${order.id}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
            <ShoppingBag className="h-10 w-10 text-primary/40" />
          </div>
          <div>
            <p className="font-serif text-xl font-medium">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add some beautiful bouquets before checking out.
            </p>
          </div>
          <Button asChild>
            <a href="/shop">Browse Bouquets</a>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
              <h2 className="mb-4 font-serif text-lg font-semibold">Your Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pickup */}
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
              <h2 className="mb-4 font-serif text-lg font-semibold">Pickup Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pickupDate">Pickup Date</Label>
                  <Select value={pickupDate} onValueChange={(v) => { setPickupDate(v); setPickupTime(''); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set(slots.map((s) => s.date))].map((date) => (
                        <SelectItem key={date} value={date}>
                          {new Date(date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupTime">Pickup Time</Label>
                  <Select value={pickupTime} onValueChange={setPickupTime} disabled={!pickupDate}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map((slot) => (
                        <SelectItem key={slot.id} value={`${slot.start_time}-${slot.end_time}`}>
                          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="instructions">Special Instructions (optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any specific requests or notes for our florists..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
              <h2 className="mb-4 font-serif text-lg font-semibold">Advance Payment</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Pay an advance now and the remaining amount at pickup.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {ADVANCE_PERCENTAGES.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setAdvancePercent(pct)}
                    className={cn(
                      'rounded-xl border-2 py-3 text-center transition-all',
                      advancePercent === pct
                        ? 'border-primary bg-rose-50 text-primary'
                        : 'border-border/40 bg-card hover:border-primary/30'
                    )}
                  >
                    <p className="font-serif text-lg font-bold">{pct}%</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(calculateAdvance(finalTotal, pct))}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
              <h2 className="mb-4 font-serif text-lg font-semibold">Order Summary</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                        <ShoppingBag className="h-6 w-6 text-primary/40" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatPrice(item.unit_price_cents)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(item.unit_price_cents * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mt-4 border-t border-border/40 pt-4">
                <Label htmlFor="coupon" className="mb-2 flex items-center gap-1 text-sm font-medium">
                  <Tag className="h-3.5 w-3.5" />
                  Coupon Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    placeholder="WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={applyCoupon}>
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="mt-1 text-xs text-red-500">{couponError}</p>
                )}
                {appliedCoupon && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {appliedCoupon.discount_percent}% discount applied
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(totalCents)}</span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>−{formatPrice(discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between font-serif text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(finalTotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" />
                    Advance ({advancePercent}%)
                  </span>
                  <span className="font-semibold text-primary">
                    {formatPrice(advanceAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Pay at Pickup
                  </span>
                  <span className="font-semibold">{formatPrice(remainingAmount)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-4 w-full"
                size="lg"
                disabled={submitting || !session}
              >
                {submitting
                  ? 'Placing order...'
                  : `Place Order · ${formatPrice(advanceAmount)}`}
              </Button>
              {!session && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Please{' '}
                  <a href="/signin" className="font-medium text-primary hover:underline">
                    sign in
                  </a>{' '}
                  to place your order.
                </p>
              )}
              <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Advance payment is processed securely via Razorpay
              </p>
            </div>
          </div>
        </form>
      </div>
    </SiteLayout>
  );
}
