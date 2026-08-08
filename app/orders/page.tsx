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
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
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
        .select('*, items:order_items(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setOrders((data ?? []) as Order[]);
          setLoaded(true);
        });
    }
  }, [session]);

  if (loading || !loaded) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="h-10 w-1/3 rounded shimmer" />
          <div className="mt-6 space-y-4">
            <div className="h-24 rounded-2xl shimmer" />
            <div className="h-24 rounded-2xl shimmer" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!session) return null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            My Orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track and manage all your orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-card py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
              <ShoppingBag className="h-10 w-10 text-primary/40" />
            </div>
            <div>
              <p className="font-serif text-xl font-medium">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                When you place an order, it will appear here.
              </p>
            </div>
            <Button asChild>
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group block rounded-2xl border border-border/40 bg-card p-5 shadow-soft transition-all hover:shadow-soft-lg hover:border-primary/30"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-primary">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-serif text-base font-semibold">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.items?.length ?? 0} item(s) · Pickup{' '}
                        {order.pickup_date
                          ? new Date(order.pickup_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'TBD'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-serif text-lg font-bold text-primary">
                        {formatPrice(order.total_cents)}
                      </p>
                      <span
                        className={cn(
                          'mt-1 inline-block rounded-full border px-3 py-0.5 text-xs font-medium',
                          ORDER_STATUS_COLORS[order.status]
                        )}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
