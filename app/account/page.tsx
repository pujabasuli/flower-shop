'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Package, Heart, LogOut, CreditCard, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';
import { formatPrice, formatDateTime } from '@/lib/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AccountPage() {
  const router = useRouter();
  const { session, profile, loading, signOut, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

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
        .limit(5)
        .then(({ data }) => setOrders((data ?? []) as Order[]));
    }
  }, [session]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="h-10 w-1/3 rounded shimmer" />
          <div className="mt-6 h-40 rounded-2xl shimmer" />
        </div>
      </SiteLayout>
    );
  }

  if (!session) return null;

  async function saveProfile() {
    await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', session!.user.id);
    await refreshProfile();
    setEditing(false);
    toast.success('Profile updated');
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">My Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {profile?.full_name || 'friend'}!
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-rose-300 font-serif text-lg font-bold text-white">
                {(profile?.full_name ?? 'U')[0]}
              </div>
              <div>
                <p className="font-serif text-lg font-semibold">
                  {profile?.full_name}
                </p>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveProfile}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{profile?.phone || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span className="capitalize">{profile?.role}</span>
                </div>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <Link href="/orders" className="block">
              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-soft transition-all hover:shadow-soft-lg hover:border-primary/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif text-sm font-semibold">My Orders</p>
                  <p className="text-xs text-muted-foreground">Track and view past orders</p>
                </div>
              </div>
            </Link>
            <Link href="/wishlist" className="block">
              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-soft transition-all hover:shadow-soft-lg hover:border-primary/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-primary">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif text-sm font-semibold">Wishlist</p>
                  <p className="text-xs text-muted-foreground">Your saved bouquets</p>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-soft opacity-60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-sm font-semibold">Saved Addresses</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 shadow-soft opacity-60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-sm font-semibold">Saved Cards</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Recent Orders</h2>
              <Link href="/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No orders yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between rounded-xl border border-border/40 p-4 transition-all hover:border-primary/30 hover:bg-rose-50/30"
                  >
                    <div>
                      <p className="font-serif text-sm font-semibold">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">
                        {formatPrice(order.total_cents)}
                      </span>
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium',
                          ORDER_STATUS_COLORS[order.status]
                        )}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
