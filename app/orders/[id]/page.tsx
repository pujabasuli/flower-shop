'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDateTime } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_STEPS,
} from '@/lib/constants';
import type { OrderStatus } from '@/types';
import { Package, ShoppingBag, CircleCheck as CheckCircle2, Clock, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/signin');
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (session) {
      supabase
        .from('orders')
        .select('*, items:order_items(*), payments:payments(*)')
        .eq('id', params.id)
        .maybeSingle()
        .then(({ data }) => {
          setOrder(data as Order);
          setLoaded(true);
        });
    }
  }, [session, params.id]);

  if (loading || !loaded) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="h-10 w-1/3 rounded shimmer" />
          <div className="mt-6 h-64 rounded-2xl shimmer" />
        </div>
      </SiteLayout>
    );
  }

  if (!order) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
          <p className="font-serif text-xl font-medium">Order not found</p>
          <Button asChild>
            <Link href="/orders">Back to Orders</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(order.status as OrderStatus);
  const isCancelled =
    order.status === 'rejected' || order.status === 'cancelled';

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/orders"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              {order.order_number}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed on {formatDateTime(order.created_at)}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex w-fit rounded-full border px-4 py-1.5 text-sm font-medium',
              ORDER_STATUS_COLORS[order.status]
            )}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Order Tracker */}
        {!isCancelled ? (
          <div className="mb-8 rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <h2 className="mb-6 font-serif text-lg font-semibold">Order Status</h2>
            <div className="relative">
              <div className="absolute left-5 top-0 h-full w-0.5 bg-border" />
              <div
                className="absolute left-5 top-0 w-0.5 bg-primary transition-all duration-500"
                style={{
                  height: `${(currentStepIndex / (ORDER_STATUS_STEPS.length - 1)) * 100}%`,
                }}
              />
              <div className="space-y-6">
                {ORDER_STATUS_STEPS.map((step, i) => {
                  const isDone = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step} className="relative flex items-center gap-4">
                      <div
                        className={cn(
                          'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                          isDone
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground',
                          isCurrent && 'ring-4 ring-rose-100'
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p
                          className={cn(
                            'font-serif text-sm font-semibold',
                            isDone ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {ORDER_STATUS_LABELS[step]}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-primary">In progress</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-serif text-lg font-semibold text-red-700">
              {order.status === 'rejected' ? 'Order Rejected' : 'Order Cancelled'}
            </p>
            <p className="mt-1 text-sm text-red-600">
              {order.status === 'rejected'
                ? 'Unfortunately, we could not accept this order. Any advance paid will be refunded.'
                : 'This order has been cancelled.'}
            </p>
          </div>
        )}

        {/* Items */}
        <div className="mb-6 rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-serif text-lg font-semibold">Order Items</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                    <Package className="h-7 w-7 text-primary/40" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatPrice(item.unit_price_cents)}
                  </p>
                </div>
                <p className="font-semibold text-sm">
                  {formatPrice(item.total_price_cents)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pickup + Payment */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
              <MapPin className="h-5 w-5 text-primary" />
              Pickup Details
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium">
                  {order.pickup_date
                    ? new Date(order.pickup_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'TBD'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Time</dt>
                <dd className="font-medium">{order.pickup_time ?? 'TBD'}</dd>
              </div>
              {order.special_instructions && (
                <div className="pt-2">
                  <dt className="text-muted-foreground">Instructions</dt>
                  <dd className="mt-1 text-sm">{order.special_instructions}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Summary
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(order.subtotal_cents)}</dd>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>Discount</dt>
                  <dd>−{formatPrice(order.discount_cents)}</dd>
                </div>
              )}
              <div className="flex justify-between font-serif text-base font-bold">
                <dt>Total</dt>
                <dd className="text-primary">{formatPrice(order.total_cents)}</dd>
              </div>
              <div className="border-t border-border/40 pt-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Advance ({order.advance_percent}%)
                  </dt>
                  <dd className="font-medium text-primary">
                    {formatPrice(order.advance_paid_cents)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pay at Pickup</dt>
                  <dd className="font-medium">
                    {formatPrice(order.remaining_cents)}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
