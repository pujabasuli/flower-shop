'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/auth-context';
import { formatPrice, formatDateTime } from '@/lib/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import type { Order } from '@/types';
import { TrendingUp, ShoppingCart, Clock, CircleCheck as CheckCircle2, DollarSign, ArrowRight, Package, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

export default function AdminDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        todayOrdersRes,
        pendingOrdersRes,
        completedOrdersRes,
        totalRevenueRes,
        todayRevenueRes,
        customersRes,
        productsRes,
        recentOrdersRes,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayISO),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['received', 'accepted', 'preparing']),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase.from('orders').select('total_cents').eq('status', 'completed'),
        supabase
          .from('orders')
          .select('total_cents')
          .gte('created_at', todayISO)
          .neq('status', 'cancelled')
          .neq('status', 'rejected'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bouquets').select('id', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const totalRevenue = (totalRevenueRes.data ?? []).reduce(
        (sum, o) => sum + (o.total_cents ?? 0),
        0
      );
      const todayRevenue = (todayRevenueRes.data ?? []).reduce(
        (sum, o) => sum + (o.total_cents ?? 0),
        0
      );

      setStats({
        todayOrders: todayOrdersRes.count ?? 0,
        pendingOrders: pendingOrdersRes.count ?? 0,
        completedOrders: completedOrdersRes.count ?? 0,
        todayRevenue,
        totalRevenue,
        totalCustomers: customersRes.count ?? 0,
        totalProducts: productsRes.count ?? 0,
      });
      setRecentOrders((recentOrdersRes.data ?? []) as Order[]);
      setLoading(false);
    }
    load();
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded shimmer" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl shimmer" />
          ))}
        </div>
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your store performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Orders"
          value={stats.todayOrders.toString()}
          icon={ShoppingCart}
          accent="from-blue-400 to-blue-500"
        />
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders.toString()}
          icon={Clock}
          accent="from-amber-400 to-amber-500"
        />
        <StatCard
          label="Today's Revenue"
          value={formatPrice(stats.todayRevenue)}
          icon={DollarSign}
          accent="from-green-400 to-green-500"
        />
        <StatCard
          label="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={TrendingUp}
          accent="from-primary to-rose-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat
          label="Completed Orders"
          value={stats.completedOrders}
          icon={CheckCircle2}
        />
        <MiniStat label="Total Customers" value={stats.totalCustomers} icon={Users} />
        <MiniStat label="Total Products" value={stats.totalProducts} icon={Package} />
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="group">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary group-hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_phone}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="py-3 pr-4 font-semibold">
                      {formatPrice(order.total_cents)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'rounded-full border px-3 py-0.5 text-xs font-medium',
                          ORDER_STATUS_COLORS[order.status]
                        )}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-serif text-2xl font-bold">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white',
            accent
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-serif text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
