'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Coupon, PickupSlot } from '@/types';
import { useAuth } from '@/features/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Tag, Calendar, Store, User } from 'lucide-react';
import { toast } from 'sonner';
import { SHOP_NAME, SHOP_TAGLINE, CONTACT_INFO } from '@/lib/constants';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage store configuration, coupons, and pickup slots
        </p>
      </div>

      <Tabs defaultValue="store">
        <TabsList className="flex-wrap">
          <TabsTrigger value="store">
            <Store className="mr-2 h-4 w-4" />
            Store
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="coupons">
            <Tag className="mr-2 h-4 w-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="pickup">
            <Calendar className="mr-2 h-4 w-4" />
            Pickup Slots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <StoreSettings />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="pickup">
          <PickupSlotsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StoreSettings() {
  const [form, setForm] = useState({
    name: SHOP_NAME,
    tagline: SHOP_TAGLINE,
    phone: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    address: CONTACT_INFO.address,
    hours: CONTACT_INFO.hours,
  });

  return (
    <div className="max-w-2xl rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
      <h2 className="mb-4 font-serif text-lg font-semibold">Store Information</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Shop Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Tagline</Label>
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Hours</Label>
          <Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
        </div>
        <Button onClick={() => toast.success('Store settings saved (display only)')}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', profile.id);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated');
      refreshProfile();
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
      <h2 className="mb-4 font-serif text-lg font-semibold">Admin Profile</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-rose-300 font-serif text-xl font-bold text-white">
            {(fullName || 'A')[0]}
          </div>
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-sm text-muted-foreground">Administrator</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}

function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Coupon>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data ?? []) as Coupon[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({ code: '', discount_percent: 10, is_active: true, expires_at: null });
    setDialogOpen(true);
  }

  function openEdit(c: Coupon) {
    setForm(c);
    setDialogOpen(true);
  }

  async function save() {
    if (!form.code?.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discount_percent: form.discount_percent ?? 0,
        is_active: form.is_active ?? true,
        expires_at: form.expires_at || null,
      };
      if (form.id) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Coupon updated');
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
        toast.success('Coupon created');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this coupon?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Coupon deleted');
    load();
  }

  async function toggleActive(c: Coupon) {
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) {
      toast.error('Failed to toggle');
      return;
    }
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">No coupons yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-4 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-base font-bold">{c.code}</p>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-primary">
                      {c.discount_percent}% off
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.expires_at
                      ? `Expires ${new Date(c.expires_at).toLocaleDateString('en-IN')}`
                      : 'No expiry'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={form.code ?? ''}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SAVE10"
              />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.discount_percent ?? 0}
                onChange={(e) => setForm({ ...form, discount_percent: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date (optional)</Label>
              <Input
                type="date"
                value={form.expires_at ? new Date(form.expires_at).toISOString().slice(0, 10) : ''}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PickupSlotsTab() {
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<PickupSlot>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pickup_slots')
      .select('*')
      .order('date', { ascending: true });
    setSlots((data ?? []) as PickupSlot[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      start_time: '10:00',
      end_time: '12:00',
      max_orders: 10,
      is_active: true,
    });
    setDialogOpen(true);
  }

  function openEdit(s: PickupSlot) {
    setForm(s);
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        max_orders: form.max_orders ?? 10,
        is_active: form.is_active ?? true,
      };
      if (form.id) {
        const { error } = await supabase.from('pickup_slots').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Slot updated');
      } else {
        const { error } = await supabase.from('pickup_slots').insert(payload);
        if (error) throw error;
        toast.success('Slot created');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this slot?')) return;
    const { error } = await supabase.from('pickup_slots').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Slot deleted');
    load();
  }

  async function toggleActive(s: PickupSlot) {
    const { error } = await supabase.from('pickup_slots').update({ is_active: !s.is_active }).eq('id', s.id);
    if (error) {
      toast.error('Failed to toggle');
      return;
    }
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Slot
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">No pickup slots yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Time</th>
                <th className="p-3 font-medium">Max Orders</th>
                <th className="p-3 font-medium">Active</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {slots.map((s) => (
                <tr key={s.id} className="hover:bg-rose-50/30">
                  <td className="p-3 font-medium">
                    {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {s.start_time} – {s.end_time}
                  </td>
                  <td className="p-3">{s.max_orders}</td>
                  <td className="p-3">
                    <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove(s.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Slot' : 'Add Pickup Slot'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date ? new Date(form.date).toISOString().slice(0, 10) : ''}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.start_time ?? ''}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.end_time ?? ''}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Orders</Label>
              <Input
                type="number"
                min={1}
                value={form.max_orders ?? 10}
                onChange={(e) => setForm({ ...form, max_orders: parseInt(e.target.value) || 10 })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
