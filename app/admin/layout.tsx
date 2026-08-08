'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingCart, Boxes, FolderTree, ChartBar as BarChart3, Settings, Flower2, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile, loading, isAdmin, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push('/signin');
      } else if (!isAdmin) {
        toast.error('You do not have admin access');
        router.push('/');
      }
    }
  }, [loading, session, isAdmin, router]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-rose-100" />
          <p className="text-sm text-muted-foreground">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-cream-50 to-sage-50/30">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/40 bg-white/80 backdrop-blur-lg md:block">
        <AdminSidebar
          pathname={pathname}
          profile={profile}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/40 bg-white shadow-xl md:hidden">
            <AdminSidebar
              pathname={pathname}
              profile={profile}
              onSignOut={handleSignOut}
              onNavigate={() => setSidebarOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-white/80 px-4 backdrop-blur-lg sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <p className="font-serif text-sm font-semibold">Admin Portal</p>
              <p className="text-xs text-muted-foreground">Fleur & Bloom</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" target="_blank">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                View Store
              </Link>
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-rose-300 font-serif text-xs font-bold text-white">
              {(profile?.full_name ?? 'A')[0]}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function AdminSidebar({
  pathname,
  profile,
  onSignOut,
  onNavigate,
}: {
  pathname: string;
  profile: { full_name: string; email?: string } | null;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/40 px-5 py-4">
        <Flower2 className="h-7 w-7 text-primary" />
        <span className="font-serif text-lg font-semibold">Fleur & Bloom</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-rose-50 hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/40 p-3">
        <div className="mb-2 flex items-center gap-2 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-rose-300 font-serif text-xs font-bold text-white">
            {(profile?.full_name ?? 'A')[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{profile?.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
