'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Bouquet, Category, Occasion } from '@/types';
import { BouquetCard } from '@/components/sections/bouquet-card';
import { ShopSkeleton } from '@/components/sections/skeletons';
import { SiteLayout } from '@/components/layout/site-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SORT_OPTIONS, ITEMS_PER_PAGE } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const occasion = searchParams.get('occasion') ?? 'all';
  const sort = searchParams.get('sort') ?? 'newest';
  const availability = searchParams.get('availability') ?? 'all';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParam('search', searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page') params.delete('page');
      router.push(`/shop?${params.toString()}`);
    },
    [searchParams, router]
  );

  const clearFilters = () => {
    router.push('/shop');
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from('bouquets')
        .select(
          '*, category:categories(*), images:bouquet_images(*), occasions:bouquet_occasions(occasion:occasions(*))',
          { count: 'exact' }
        )
        .eq('is_active', true);

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (category !== 'all') {
        const cat = categories.find((c) => c.slug === category);
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (availability === 'in-stock') {
        query = query.gt('stock', 0);
      } else if (availability === 'low-stock') {
        query = query.gt('stock', 0).lte('stock', 5);
      }
      if (minPrice) {
        query = query.gte('price_cents', parseInt(minPrice, 10) * 100);
      }
      if (maxPrice) {
        query = query.lte('price_cents', parseInt(maxPrice, 10) * 100);
      }

      if (sort === 'price-asc') {
        query = query.order('price_cents', { ascending: true });
      } else if (sort === 'price-desc') {
        query = query.order('price_cents', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) {
        console.error('Error loading bouquets:', error.message);
      }
      let results = (data ?? []) as unknown as Bouquet[];

      if (occasion !== 'all') {
        const occ = occasions.find((o) => o.slug === occasion);
        if (occ) {
          results = results.filter((b) =>
            (b as unknown as { occasions?: { occasion: Occasion }[] }).occasions?.some(
              (bo) => bo.occasion.id === occ.id
            )
          );
        }
      }

      setBouquets(results);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, occasion, sort, availability, minPrice, maxPrice, page, categories, occasions]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data as Category[]);
    });
    supabase.from('occasions').select('*').order('name').then(({ data }) => {
      setOccasions(data as Occasion[]);
    });
  }, []);

  const hasActiveFilters =
    category !== 'all' ||
    occasion !== 'all' ||
    availability !== 'all' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    search !== '';

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Our Collection
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Discover the perfect bouquet for every moment
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bouquets..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sort} onValueChange={(v) => updateParam('sort', v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Filters"
              className="lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <aside
            className={cn(
              'space-y-6',
              showFilters ? 'block' : 'hidden lg:block'
            )}
          >
            <div className="rounded-2xl border border-border/40 bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-base font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block text-sm font-medium">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => updateParam('category', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">Occasion</Label>
                  <Select
                    value={occasion}
                    onValueChange={(v) => updateParam('occasion', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All occasions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Occasions</SelectItem>
                      {occasions.map((o) => (
                        <SelectItem key={o.id} value={o.slug}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">Availability</Label>
                  <Select
                    value={availability}
                    onValueChange={(v) => updateParam('availability', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">Price Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => updateParam('minPrice', e.target.value)}
                      className="text-sm"
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => updateParam('maxPrice', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prices in {formatPrice(0).replace(/0$/, '')}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div>
            {loading ? (
              <ShopSkeleton />
            ) : bouquets.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
                  <X className="h-10 w-10 text-primary/40" />
                </div>
                <div>
                  <p className="font-serif text-xl font-medium">No bouquets found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your filters or search terms.
                  </p>
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {bouquets.map((b) => (
                    <BouquetCard key={b.id} bouquet={b} />
                  ))}
                </div>
                <Pagination page={page} total={bouquets.length} />
              </>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Pagination({ page, total }: { page: number; total: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasNext = total === ITEMS_PER_PAGE;
  const hasPrev = page > 1;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrev}
        onClick={() => goTo(page - 1)}
      >
        Previous
      </Button>
      <span className="px-4 text-sm font-medium text-muted-foreground">
        Page {page}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={!hasNext}
        onClick={() => goTo(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
