'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDateTime } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/constants';
import { ArrowLeft, CircleCheck as CheckCircle2, Circle as XCircle, Clock, Package, MapPin, CreditCard, User, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminOrderDetail() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*, items:order_items(*), payments:payments(*)')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as Order);
        setLoading(false);
      });
  }, [params.id]);

  async function updateStatus(status: OrderStatus) {
    if (!order) return;
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id);
    if (error) {
      toast.error('Failed to update status');
      return;
    }

    await supabase.from('notifications').insert({
      user_id: order.user_id,
      order_id: order.id,
      channel: 'in_app',
      subject: `Order ${ORDER_STATUS_LABELS[status]}`,
      message: `Your order ${order.order_number} status has been updated to: ${ORDER_STATUS_LABELS[status]}.`,
      status: 'sent',
    });

    toast.success(`Order marked as ${ORDER_STATUS_LABELS[status]}`);
    setOrder({ ...order, status });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded shimmer" />
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="font-serif text-xl">Order not found</p>
        <Button asChild>
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const actions = (
    <>
      {order.status === 'received' && (
        <div className="flex gap-2">
          <Button onClick={() => updateStatus('accepted')}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Accept Order
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => updateStatus('rejected')}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      )}
      {order.status === 'accepted' && (
        <Button onClick={() => updateStatus('preparing')}>
          <Clock className="mr-2 h-4 w-4" />
          Start Preparing
        </Button>
      )}
      {order.status === 'preparing' && (
        <Button onClick={() => updateStatus('ready')}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark as Ready
        </Button>
      )}
      {order.status === 'ready' && (
        <Button onClick={() => updateStatus('completed')}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark as Completed
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            {order.order_number}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium',
              ORDER_STATUS_COLORS[order.status]
            )}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          {actions}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <h2 className="mb-4 font-serif text-lg font-semibold">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border-b border-border/30 pb-4 last:border-0"
                >
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
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatPrice(item.unit_price_cents)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(item.total_price_cents)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal_cents)}</span>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({order.coupon_code})</span>
                  <span>−{formatPrice(order.discount_cents)}</span>
                </div>
              )}
              <div className="flex justify-between font-serif text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(order.total_cents)}
                </span>
              </div>
            </div>
          </div>

          {order.special_instructions && (
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
              <h2 className="mb-2 font-serif text-lg font-semibold">
                Special Instructions
              </h2>
              <p className="text-sm text-muted-foreground">
                {order.special_instructions}
              </p>
            </div>
          )}
        </div>

        {/* Customer + Payment */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <h2 className="mb-4 font-serif text-lg font-semibold">Customer</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="break-all">{order.customer_email}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
              <MapPin className="h-5 w-5 text-primary" />
              Pickup
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {order.pickup_date
                    ? new Date(order.pickup_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'TBD'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{order.pickup_time ?? 'TBD'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{formatPrice(order.total_cents)}</span>
              </div>
              <div className="border-t border-border/40 pt-2">
                <span className="text-xs text-muted-foreground">
                  Pay full amount at pickup
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
