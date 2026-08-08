'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, Bouquet, Profile } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { formatPrice, formatDateTime } from '@/lib/format';
import { TrendingUp, ShoppingCart, DollarSign, Download, Users, Package, TriangleAlert as AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesRow {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

interface TopProduct {
  name: string;
  image_url: string | null;
  count: number;
  revenue: number;
}

interface TopCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  orders: number;
  total: number;
}

interface PaymentRow {
  type: string;
  status: string;
  amount: number;
}

export default function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [products, setProducts] = useState<Bouquet[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    async function load() {
      const [ordersRes, paymentsRes, productsRes, customersRes] =
        await Promise.all([
          supabase
            .from('orders')
            .select('*, items:order_items(*)')
            .order('created_at', { ascending: false }),
          supabase.from('payments').select('type, status, amount_cents'),
          supabase.from('bouquets').select('*, images:bouquet_images(*)'),
          supabase.from('profiles').select('*'),
        ]);

      setOrders((ordersRes.data ?? []) as Order[]);
      setPayments(
        (paymentsRes.data ?? []).map((p) => ({
          type: p.type as string,
          status: p.status as string,
          amount: p.amount_cents as number,
        }))
      );
      setProducts((productsRes.data ?? []) as Bouquet[]);
      setCustomers((customersRes.data ?? []) as Profile[]);
      setLoading(false);
    }
    load();
  }, []);

  const periodDays = period === 'all' ? Infinity : parseInt(period);
  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, periodDays, period]);

  const dailySales = useMemo(() => computeDailySales(filteredOrders), [filteredOrders]);
  const monthlySales = useMemo(() => computeMonthlySales(filteredOrders), [filteredOrders]);
  const topProducts = useMemo(() => computeTopProducts(filteredOrders), [filteredOrders]);
  const topCustomers = useMemo(() => computeTopCustomers(filteredOrders), [filteredOrders]);
  const inventoryReport = useMemo(() => computeInventory(products), [products]);
  const paymentReport = useMemo(() => computePayments(payments), [payments]);

  const totalRevenue = filteredOrders
    .filter((o) => o.status === 'completed')
    .reduce((s, o) => s + o.total_cents, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  function exportCSV(filename: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = String(r[h] ?? '');
            return val.includes(',') ? `"${val}"` : val;
          })
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Sales, inventory, and payment analytics
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatPrice(totalRevenue)} icon={DollarSign} accent="from-green-400 to-green-500" />
        <StatCard label="Total Orders" value={totalOrders.toString()} icon={ShoppingCart} accent="from-blue-400 to-blue-500" />
        <StatCard label="Avg Order Value" value={formatPrice(avgOrderValue)} icon={TrendingUp} accent="from-primary to-rose-500" />
        <StatCard label="Customers" value={customers.length.toString()} icon={Users} accent="from-purple-400 to-purple-500" />
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Sales */}
        <TabsContent value="sales">
          <div className="space-y-6">
            <ReportTable
              title="Daily Sales"
              headers={['Date', 'Orders', 'Revenue']}
              rows={dailySales.map((r) => ({
                Date: r.label,
                Orders: r.orders,
                Revenue: formatPrice(r.revenue),
              }))}
              onExport={() =>
                exportCSV('daily-sales.csv', dailySales.map((r) => ({ date: r.date, orders: r.orders, revenue_cents: r.revenue })))
              }
              barData={dailySales.map((r) => ({ label: r.label, value: r.revenue }))}
            />
            <ReportTable
              title="Monthly Sales"
              headers={['Month', 'Orders', 'Revenue']}
              rows={monthlySales.map((r) => ({
                Month: r.label,
                Orders: r.orders,
                Revenue: formatPrice(r.revenue),
              }))}
              onExport={() =>
                exportCSV('monthly-sales.csv', monthlySales.map((r) => ({ month: r.label, orders: r.orders, revenue_cents: r.revenue })))
              }
              barData={monthlySales.map((r) => ({ label: r.label, value: r.revenue }))}
            />
          </div>
        </TabsContent>

        {/* Top Products */}
        <TabsContent value="products">
          <ReportTable
            title="Top Products"
            headers={['Product', 'Units Sold', 'Revenue']}
            rows={topProducts.map((p) => ({
              Product: p.name,
              'Units Sold': p.count,
              Revenue: formatPrice(p.revenue),
            }))}
            onExport={() => exportCSV('top-products.csv', topProducts.map((p) => ({ name: p.name, units_sold: p.count, revenue_cents: p.revenue })))}
            productImages={topProducts.map((p) => p.image_url)}
          />
        </TabsContent>

        {/* Top Customers */}
        <TabsContent value="customers">
          <ReportTable
            title="Top Customers"
            headers={['Name', 'Phone', 'Email', 'Orders', 'Total Spent']}
            rows={topCustomers.map((c) => ({
              Name: c.name,
              Phone: c.phone,
              Email: c.email,
              Orders: c.orders,
              'Total Spent': formatPrice(c.total),
            }))}
            onExport={() =>
              exportCSV('top-customers.csv', topCustomers.map((c) => ({ name: c.name, phone: c.phone, email: c.email, orders: c.orders, total_cents: c.total })))
            }
          />
        </TabsContent>

        {/* Inventory */}
        <TabsContent value="inventory">
          <ReportTable
            title="Inventory Report"
            headers={['Product', 'Stock', 'Status']}
            rows={inventoryReport.map((r) => ({
              Product: r.name,
              Stock: r.stock,
              Status: r.status,
            }))}
            onExport={() => exportCSV('inventory-report.csv', inventoryReport.map((r) => ({ name: r.name, stock: r.stock, status: r.status })))}
            rowStatus={(i) => inventoryReport[i].status}
          />
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <ReportTable
            title="Payment Report"
            headers={['Type', 'Status', 'Amount']}
            rows={paymentReport.map((p) => ({
              Type: p.type,
              Status: p.status,
              Amount: formatPrice(p.amount),
            }))}
            onExport={() => exportJSON('payments-report.json', paymentReport)}
          />
        </TabsContent>
      </Tabs>
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
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-serif text-2xl font-bold">{value}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white', accent)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function ReportTable({
  title,
  headers,
  rows,
  onExport,
  barData,
  productImages,
  rowStatus,
}: {
  title: string;
  headers: string[];
  rows: Record<string, unknown>[];
  onExport: () => void;
  barData?: { label: string; value: number }[];
  productImages?: (string | null)[];
  rowStatus?: (i: number) => string;
}) {
  const maxBar = barData ? Math.max(...barData.map((d) => d.value), 1) : 1;
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">{title}</h2>
        <Button variant="outline" size="sm" onClick={onExport} disabled={rows.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {barData && barData.length > 0 && (
        <div className="mb-6 flex h-32 items-end gap-1 overflow-x-auto">
          {barData.slice(0, 20).map((d, i) => (
            <div key={i} className="flex min-w-[40px] flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-primary/60 to-primary transition-all"
                style={{ height: `${(d.value / maxBar) * 100}%`, minHeight: '4px' }}
                title={formatPrice(d.value)}
              />
              <span className="truncate text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                {headers.map((h) => (
                  <th key={h} className="pb-3 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-rose-50/30">
                  {headers.map((h, hi) => (
                    <td key={h} className="py-3 pr-4">
                      {hi === 0 && productImages?.[i] ? (
                        <div className="flex items-center gap-2">
                          {productImages[i] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={productImages[i]!} alt="" className="h-8 w-8 rounded object-cover" />
                          ) : null}
                          <span>{String(row[h])}</span>
                        </div>
                      ) : h === 'Status' && rowStatus ? (
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            rowStatus(i) === 'Out of Stock'
                              ? 'bg-red-100 text-red-700'
                              : rowStatus(i) === 'Low Stock'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                          )}
                        >
                          {String(row[h])}
                        </span>
                      ) : (
                        <span className={hi === headers.length - 1 && h.includes('Revenue') || h.includes('Spent') || h.includes('Amount') ? 'font-semibold text-primary' : ''}>
                          {String(row[h])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Computation helpers ----

function computeDailySales(orders: Order[]): SalesRow[] {
  const map = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders) {
    const d = new Date(o.created_at);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const cur = map.get(key) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    if (o.status === 'completed') cur.revenue += o.total_cents;
    map.set(key, { ...cur, orders: cur.orders, revenue: cur.revenue } as { orders: number; revenue: number });
    // re-set with label
    map.set(key, { orders: cur.orders, revenue: cur.revenue });
    (map.get(key) as { label?: string }).label = label;
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, label: (v as { label?: string }).label ?? date, orders: v.orders, revenue: v.revenue }));
}

function computeMonthlySales(orders: Order[]): SalesRow[] {
  const map = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders) {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const cur = map.get(key) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    if (o.status === 'completed') cur.revenue += o.total_cents;
    (cur as { label?: string }).label = label;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, label: (v as { label?: string }).label ?? date, orders: v.orders, revenue: v.revenue }));
}

function computeTopProducts(orders: Order[]): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const o of orders) {
    if (o.status === 'rejected' || o.status === 'cancelled') continue;
    for (const item of o.items ?? []) {
      const cur = map.get(item.name) ?? { name: item.name, image_url: item.image_url ?? null, count: 0, revenue: 0 };
      cur.count += item.quantity;
      cur.revenue += item.total_price_cents;
      map.set(item.name, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
}

function computeTopCustomers(orders: Order[]): TopCustomer[] {
  const map = new Map<string, TopCustomer>();
  for (const o of orders) {
    const key = o.user_id;
    const cur = map.get(key) ?? {
      id: key,
      name: o.customer_name,
      phone: o.customer_phone,
      email: o.customer_email,
      orders: 0,
      total: 0,
    };
    cur.orders += 1;
    if (o.status === 'completed') cur.total += o.total_cents;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 10);
}

function computeInventory(products: Bouquet[]): { name: string; stock: number; status: string }[] {
  return products.map((p) => ({
    name: p.name,
    stock: p.stock,
    status: p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? 'Low Stock' : 'In Stock',
  }));
}

function computePayments(payments: PaymentRow[]): { type: string; status: string; amount: number }[] {
  const map = new Map<string, { type: string; status: string; amount: number }>();
  for (const p of payments) {
    const key = `${p.type}-${p.status}`;
    const cur = map.get(key) ?? { type: p.type, status: p.status, amount: 0 };
    cur.amount += p.amount;
    map.set(key, cur);
  }
  return Array.from(map.values());
}
