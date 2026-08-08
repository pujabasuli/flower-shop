'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Flower, WrappingPaper, Ribbon, GreetingCard, GiftAddon } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, TriangleAlert as AlertTriangle, Search } from 'lucide-react';
import { formatPrice, slugify } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type InventoryType = 'flowers' | 'wrapping_papers' | 'ribbons' | 'greeting_cards' | 'gift_addons';

interface InventoryItem {
  id: string;
  name: string;
  color?: string | null;
  design?: string | null;
  type?: string;
  price_cents: number;
  stock: number;
  image_url?: string | null;
  is_active: boolean;
}

const TAB_CONFIG: {
  value: InventoryType;
  label: string;
  hasColor: boolean;
  hasDesign: boolean;
  hasType: boolean;
}[] = [
  { value: 'flowers', label: 'Flowers', hasColor: true, hasDesign: false, hasType: false },
  { value: 'wrapping_papers', label: 'Wrapping', hasColor: true, hasDesign: false, hasType: false },
  { value: 'ribbons', label: 'Ribbons', hasColor: true, hasDesign: false, hasType: false },
  { value: 'greeting_cards', label: 'Cards', hasColor: false, hasDesign: true, hasType: false },
  { value: 'gift_addons', label: 'Gifts', hasColor: false, hasDesign: false, hasType: true },
];

const LOW_STOCK_THRESHOLD = 5;

export default function AdminInventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Manage stock for custom bouquet components
        </p>
      </div>
      <Tabs defaultValue="flowers">
        <TabsList className="flex-wrap">
          {TAB_CONFIG.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TAB_CONFIG.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <InventoryTab type={t.value} config={t} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function InventoryTab({
  type,
  config,
}: {
  type: InventoryType;
  config: (typeof TAB_CONFIG)[number];
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<InventoryItem>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from(type)
      .select('*')
      .order('created_at', { ascending: false });
    setItems((data ?? []) as InventoryItem[]);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter((i) => i.stock <= LOW_STOCK_THRESHOLD && i.stock > 0);
  const outOfStock = items.filter((i) => i.stock === 0);

  function openCreate() {
    setForm({
      name: '',
      color: '',
      design: '',
      type: config.hasType ? 'chocolate' : undefined,
      price_cents: 0,
      stock: 0,
      image_url: '',
      is_active: true,
    });
    setDialogOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setForm(item);
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        price_cents: form.price_cents ?? 0,
        stock: form.stock ?? 0,
        image_url: form.image_url || null,
        is_active: form.is_active ?? true,
      };
      if (config.hasColor) payload.color = form.color || null;
      if (config.hasDesign) payload.design = form.design || null;
      if (config.hasType) payload.type = form.type ?? 'other';

      if (form.id) {
        const { error } = await supabase.from(type).update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Updated');
      } else {
        const { error } = await supabase.from(type).insert(payload);
        if (error) throw error;
        toast.success('Created');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from(type).delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Deleted');
    load();
  }

  async function quickUpdateStock(item: InventoryItem, newStock: number) {
    const { error } = await supabase
      .from(type)
      .update({ stock: newStock })
      .eq('id', item.id);
    if (error) {
      toast.error('Failed to update stock');
      return;
    }
    setItems(items.map((i) => (i.id === item.id ? { ...i, stock: newStock } : i)));
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          {lowStock.length > 0 && (
            <span className="text-amber-700">
              {lowStock.length} item(s) running low
            </span>
          )}
          {outOfStock.length > 0 && (
            <span className="text-red-600">
              {outOfStock.length} item(s) out of stock
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">No items found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3 font-medium">Name</th>
                {config.hasColor && <th className="p-3 font-medium">Color</th>}
                {config.hasDesign && <th className="p-3 font-medium">Design</th>}
                {config.hasType && <th className="p-3 font-medium">Type</th>}
                <th className="p-3 font-medium">Price</th>
                <th className="p-3 font-medium">Stock</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-rose-50/30">
                  <td className="p-3 font-medium">{item.name}</td>
                  {config.hasColor && (
                    <td className="p-3 text-muted-foreground">
                      {item.color || '—'}
                    </td>
                  )}
                  {config.hasDesign && (
                    <td className="p-3 text-muted-foreground">
                      {item.design || '—'}
                    </td>
                  )}
                  {config.hasType && (
                    <td className="p-3">
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs capitalize text-primary">
                        {item.type}
                      </span>
                    </td>
                  )}
                  <td className="p-3 font-semibold">{formatPrice(item.price_cents)}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.stock}
                      onChange={(e) =>
                        quickUpdateStock(item, parseInt(e.target.value) || 0)
                      }
                      className={cn(
                        'w-20 rounded-lg border px-2 py-1 text-sm font-medium',
                        item.stock === 0
                          ? 'border-red-300 text-red-600'
                          : item.stock <= LOW_STOCK_THRESHOLD
                            ? 'border-amber-300 text-amber-600'
                            : 'border-border text-green-600'
                      )}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500"
                        onClick={() => remove(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {config.hasColor && (
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={form.color ?? ''}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="Red, Blue..."
                />
              </div>
            )}
            {config.hasDesign && (
              <div className="space-y-2">
                <Label>Design</Label>
                <Input
                  value={form.design ?? ''}
                  onChange={(e) => setForm({ ...form, design: e.target.value })}
                  placeholder="Floral, Minimalist..."
                />
              </div>
            )}
            {config.hasType && (
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={form.type ?? 'chocolate'}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="chocolate">Chocolate</option>
                  <option value="teddy">Teddy</option>
                  <option value="vase">Vase</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (paise)</Label>
                <Input
                  type="number"
                  value={form.price_cents ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, price_cents: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={form.stock ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, stock: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={form.image_url ?? ''}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Active
            </label>
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
