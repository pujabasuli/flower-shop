'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice, formatDateTime } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/constants';
import { Search, ChevronRight, CircleCheck as CheckCircle2, Circle as XCircle, Clock, Package, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'received', label: 'Received' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready for Pickup' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search)
  );

  async function updateStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order status');
      return;
    }

    // Create notification for customer
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        order_id: orderId,
        channel: 'in_app',
        subject: `Order ${ORDER_STATUS_LABELS[status]}`,
        message: `Your order ${order.order_number} status has been updated to: ${ORDER_STATUS_LABELS[status]}.`,
        status: 'sent',
      });
    }

    toast.success(`Order marked as ${ORDER_STATUS_LABELS[status]}`);
    loadOrders();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage and track all customer orders
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order number, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-border/40 bg-card p-5 shadow-soft"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left */}
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-primary">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-serif text-base font-semibold text-primary hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{order.customer_name}</span>
                      <span>·</span>
                      <span>{order.customer_phone}</span>
                    </div>
                  </div>
                </div>

                {/* Middle */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-serif text-lg font-bold text-primary">
                      {formatPrice(order.total_cents)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="flex items-center gap-1 text-sm font-medium">
                      <Calendar className="h-3 w-3" />
                      {order.pickup_date
                        ? new Date(order.pickup_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'TBD'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium',
                      ORDER_STATUS_COLORS[order.status]
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {order.status === 'received' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, 'accepted')}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => updateStatus(order.id, 'rejected')}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(order.id, 'preparing')}
                    >
                      <Clock className="mr-1 h-4 w-4" />
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(order.id, 'ready')}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(order.id, 'completed')}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Complete
                    </Button>
                  )}
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button size="sm" variant="ghost">
                      Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
