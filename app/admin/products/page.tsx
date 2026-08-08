'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bouquet, Category, Occasion } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Star, Image as ImageIcon, X } from 'lucide-react';
import { formatPrice, slugify } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductForm {
  id?: string;
  name: string;
  description: string;
  price_cents: number;
  prep_time_minutes: number;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  category_id: string;
  flowers_included: string;
  occasion_ids: string[];
  image_urls: string[];
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price_cents: 0,
  prep_time_minutes: 60,
  stock: 0,
  is_featured: false,
  is_active: true,
  category_id: '',
  flowers_included: '',
  occasion_ids: [],
  image_urls: [],
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Bouquet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bouquets')
      .select('*, category:categories(*), images:bouquet_images(*)')
      .order('created_at', { ascending: false });
    setProducts((data ?? []) as Bouquet[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data as Category[]);
    });
    supabase.from('occasions').select('*').order('name').then(({ data }) => {
      setOccasions(data as Occasion[]);
    });
  }, [loadProducts]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setNewImageUrl('');
    setDialogOpen(true);
  }

  function openEdit(product: Bouquet) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price_cents: product.price_cents,
      prep_time_minutes: product.prep_time_minutes,
      stock: product.stock,
      is_featured: product.is_featured,
      is_active: product.is_active,
      category_id: product.category_id ?? '',
      flowers_included: product.flowers_included ?? '',
      occasion_ids: [],
      image_urls: product.images?.map((i) => i.image_url) ?? [],
    });
    setNewImageUrl('');
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    setSaving(true);
    try {
      const slug = slugify(form.name);
      const payload = {
        name: form.name,
        slug,
        description: form.description || null,
        price_cents: form.price_cents,
        prep_time_minutes: form.prep_time_minutes,
        stock: form.stock,
        is_featured: form.is_featured,
        is_active: form.is_active,
        category_id: form.category_id || null,
        flowers_included: form.flowers_included || null,
      };

      if (form.id) {
        const { error } = await supabase
          .from('bouquets')
          .update(payload)
          .eq('id', form.id);
        if (error) throw error;

        // Replace images
        await supabase.from('bouquet_images').delete().eq('bouquet_id', form.id);
        if (form.image_urls.length > 0) {
          await supabase
            .from('bouquet_images')
            .insert(
              form.image_urls.map((url, i) => ({
                bouquet_id: form.id,
                image_url: url,
                position: i,
              }))
            );
        }
        toast.success('Product updated');
      } else {
        const { data, error } = await supabase
          .from('bouquets')
          .insert(payload)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) {
          if (form.image_urls.length > 0) {
            await supabase.from('bouquet_images').insert(
              form.image_urls.map((url, i) => ({
                bouquet_id: data.id,
                image_url: url,
                position: i,
              }))
            );
          }
          toast.success('Product created');
        }
      }
      setDialogOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product');
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const { error } = await supabase.from('bouquets').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete product');
      return;
    }
    toast.success('Product deleted');
    loadProducts();
  }

  function addImageUrl() {
    if (!newImageUrl.trim()) return;
    setForm({ ...form, image_urls: [...form.image_urls, newImageUrl.trim()] });
    setNewImageUrl('');
  }

  function removeImageUrl(idx: number) {
    setForm({
      ...form,
      image_urls: form.image_urls.filter((_, i) => i !== idx),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your bouquet catalog
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-rose-50/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50">
                          <ImageIcon className="h-6 w-6 text-primary/30" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.is_featured && (
                          <Badge className="mt-0.5 bg-amber-100 text-amber-700">
                            <Star className="mr-1 h-3 w-3" /> Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {product.category?.name ?? '—'}
                  </td>
                  <td className="p-4 font-semibold">
                    {formatPrice(product.price_cents)}
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'font-medium',
                        product.stock === 0
                          ? 'text-red-500'
                          : product.stock <= 5
                            ? 'text-amber-500'
                            : 'text-green-600'
                      )}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        product.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => remove(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Eternal Rose"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                placeholder="A stunning arrangement of..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Price (in paise)</Label>
                <Input
                  type="number"
                  value={form.price_cents}
                  onChange={(e) =>
                    setForm({ ...form, price_cents: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formatPrice(form.price_cents)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Prep Time (min)</Label>
                <Input
                  type="number"
                  value={form.prep_time_minutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prep_time_minutes: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Flowers Included</Label>
              <Input
                value={form.flowers_included}
                onChange={(e) =>
                  setForm({ ...form, flowers_included: e.target.value })
                }
                placeholder="12 Red Roses, Baby's Breath, Eucalyptus"
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addImageUrl}>
                  Add
                </Button>
              </div>
              {form.image_urls.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.image_urls.map((url, i) => (
                    <div key={i} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Product ${i + 1}`}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm({ ...form, is_featured: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
