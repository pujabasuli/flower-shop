/*
# Flower Shop — Full Schema

## Overview
Creates the complete data model for Fleur & Bloom, an artisan flower shop with customer
ordering, a custom bouquet builder, admin product/inventory/order management, reviews,
wishlists, coupons, pickup slots, and notifications.

## Tables
1. profiles, 2. categories, 3. occasions, 4. bouquets, 5. bouquet_images,
6. bouquet_occasions, 7. flowers, 8. wrapping_papers, 9. ribbons, 10. greeting_cards,
11. gift_addons, 12. custom_bouquets, 13. reviews, 14. wishlists, 15. pickup_slots,
16. coupons, 17. orders, 18. order_items, 19. payments, 20. notifications.

## Security
- RLS enabled on every table.
- Public read on catalog tables (anon + authenticated).
- Owner-scoped CRUD on customer data via auth.uid() ownership.
- Admin-only writes on catalog/inventory tables via is_admin() SECURITY DEFINER function.
- Owner columns default to auth.uid() so inserts that omit the owner still satisfy policy.
*/

-- ============================================================
-- profiles (created first so is_admin() can reference it)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ============================================================
-- Helper: is_admin() — true if the current user's profile role is 'admin'
-- SECURITY DEFINER so it can read profiles regardless of caller RLS.
-- ============================================================
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Now profiles policies (is_admin exists)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id or is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- categories
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories_read_public" on public.categories;
create policy "categories_read_public" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- occasions
-- ============================================================
create table if not exists public.occasions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.occasions enable row level security;

drop policy if exists "occasions_read_public" on public.occasions;
create policy "occasions_read_public" on public.occasions
  for select to anon, authenticated using (true);

drop policy if exists "occasions_admin_write" on public.occasions;
create policy "occasions_admin_write" on public.occasions
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- bouquets
-- ============================================================
create table if not exists public.bouquets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null default 0,
  prep_time_minutes integer not null default 60,
  stock integer not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  category_id uuid references public.categories(id) on delete set null,
  flowers_included text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bouquets_category on public.bouquets(category_id);
create index if not exists idx_bouquets_active on public.bouquets(is_active);
create index if not exists idx_bouquets_featured on public.bouquets(is_featured);

alter table public.bouquets enable row level security;

drop policy if exists "bouquets_read_public" on public.bouquets;
create policy "bouquets_read_public" on public.bouquets
  for select to anon, authenticated using (true);

drop policy if exists "bouquets_admin_write" on public.bouquets;
create policy "bouquets_admin_write" on public.bouquets
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- bouquet_images
-- ============================================================
create table if not exists public.bouquet_images (
  id uuid primary key default gen_random_uuid(),
  bouquet_id uuid not null references public.bouquets(id) on delete cascade,
  image_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_bouquet_images_bouquet on public.bouquet_images(bouquet_id);

alter table public.bouquet_images enable row level security;

drop policy if exists "bouquet_images_read_public" on public.bouquet_images;
create policy "bouquet_images_read_public" on public.bouquet_images
  for select to anon, authenticated using (true);

drop policy if exists "bouquet_images_admin_write" on public.bouquet_images;
create policy "bouquet_images_admin_write" on public.bouquet_images
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- bouquet_occasions (many-to-many)
-- ============================================================
create table if not exists public.bouquet_occasions (
  bouquet_id uuid not null references public.bouquets(id) on delete cascade,
  occasion_id uuid not null references public.occasions(id) on delete cascade,
  primary key (bouquet_id, occasion_id)
);

alter table public.bouquet_occasions enable row level security;

drop policy if exists "bouquet_occasions_read_public" on public.bouquet_occasions;
create policy "bouquet_occasions_read_public" on public.bouquet_occasions
  for select to anon, authenticated using (true);

drop policy if exists "bouquet_occasions_admin_write" on public.bouquet_occasions;
create policy "bouquet_occasions_admin_write" on public.bouquet_occasions
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- flowers (inventory for custom builder)
-- ============================================================
create table if not exists public.flowers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  price_cents integer not null default 0,
  stock integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.flowers enable row level security;

drop policy if exists "flowers_read_public" on public.flowers;
create policy "flowers_read_public" on public.flowers
  for select to anon, authenticated using (true);

drop policy if exists "flowers_admin_write" on public.flowers;
create policy "flowers_admin_write" on public.flowers
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- wrapping_papers
-- ============================================================
create table if not exists public.wrapping_papers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  price_cents integer not null default 0,
  stock integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wrapping_papers enable row level security;

drop policy if exists "wrapping_papers_read_public" on public.wrapping_papers;
create policy "wrapping_papers_read_public" on public.wrapping_papers
  for select to anon, authenticated using (true);

drop policy if exists "wrapping_papers_admin_write" on public.wrapping_papers;
create policy "wrapping_papers_admin_write" on public.wrapping_papers
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- ribbons
-- ============================================================
create table if not exists public.ribbons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  price_cents integer not null default 0,
  stock integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.ribbons enable row level security;

drop policy if exists "ribbons_read_public" on public.ribbons;
create policy "ribbons_read_public" on public.ribbons
  for select to anon, authenticated using (true);

drop policy if exists "ribbons_admin_write" on public.ribbons;
create policy "ribbons_admin_write" on public.ribbons
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- greeting_cards
-- ============================================================
create table if not exists public.greeting_cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  design text,
  price_cents integer not null default 0,
  stock integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.greeting_cards enable row level security;

drop policy if exists "greeting_cards_read_public" on public.greeting_cards;
create policy "greeting_cards_read_public" on public.greeting_cards
  for select to anon, authenticated using (true);

drop policy if exists "greeting_cards_admin_write" on public.greeting_cards;
create policy "greeting_cards_admin_write" on public.greeting_cards
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- gift_addons (chocolates, teddies, vases)
-- ============================================================
create table if not exists public.gift_addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('chocolate','teddy','vase','other')),
  price_cents integer not null default 0,
  stock integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.gift_addons enable row level security;

drop policy if exists "gift_addons_read_public" on public.gift_addons;
create policy "gift_addons_read_public" on public.gift_addons
  for select to anon, authenticated using (true);

drop policy if exists "gift_addons_admin_write" on public.gift_addons;
create policy "gift_addons_admin_write" on public.gift_addons
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- custom_bouquets
-- ============================================================
create table if not exists public.custom_bouquets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'My Custom Bouquet',
  flowers jsonb not null default '[]',
  wrapping_paper_id uuid references public.wrapping_papers(id) on delete set null,
  ribbon_id uuid references public.ribbons(id) on delete set null,
  greeting_card_id uuid references public.greeting_cards(id) on delete set null,
  card_message text,
  gift_addon_ids jsonb not null default '[]',
  budget_cents integer,
  inspiration_image_url text,
  total_price_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_custom_bouquets_user on public.custom_bouquets(user_id);

alter table public.custom_bouquets enable row level security;

drop policy if exists "custom_bouquets_select_own" on public.custom_bouquets;
create policy "custom_bouquets_select_own" on public.custom_bouquets
  for select to authenticated using (auth.uid() = user_id or is_admin());

drop policy if exists "custom_bouquets_insert_own" on public.custom_bouquets;
create policy "custom_bouquets_insert_own" on public.custom_bouquets
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "custom_bouquets_update_own" on public.custom_bouquets;
create policy "custom_bouquets_update_own" on public.custom_bouquets
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "custom_bouquets_delete_own" on public.custom_bouquets;
create policy "custom_bouquets_delete_own" on public.custom_bouquets
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- reviews
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  bouquet_id uuid not null references public.bouquets(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_bouquet on public.reviews(bouquet_id);

alter table public.reviews enable row level security;

drop policy if exists "reviews_read_public" on public.reviews;
create policy "reviews_read_public" on public.reviews
  for select to anon, authenticated using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- wishlists
-- ============================================================
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bouquet_id uuid not null references public.bouquets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, bouquet_id)
);

create index if not exists idx_wishlists_user on public.wishlists(user_id);

alter table public.wishlists enable row level security;

drop policy if exists "wishlists_select_own" on public.wishlists;
create policy "wishlists_select_own" on public.wishlists
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "wishlists_insert_own" on public.wishlists;
create policy "wishlists_insert_own" on public.wishlists
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "wishlists_delete_own" on public.wishlists;
create policy "wishlists_delete_own" on public.wishlists
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- pickup_slots
-- ============================================================
create table if not exists public.pickup_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  max_orders integer not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pickup_slots enable row level security;

drop policy if exists "pickup_slots_read_public" on public.pickup_slots;
create policy "pickup_slots_read_public" on public.pickup_slots
  for select to anon, authenticated using (true);

drop policy if exists "pickup_slots_admin_write" on public.pickup_slots;
create policy "pickup_slots_admin_write" on public.pickup_slots
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- coupons
-- ============================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent between 0 and 100),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

drop policy if exists "coupons_read_public" on public.coupons;
create policy "coupons_read_public" on public.coupons
  for select to anon, authenticated using (true);

drop policy if exists "coupons_admin_write" on public.coupons;
create policy "coupons_admin_write" on public.coupons
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- orders
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'received' check (status in ('received','accepted','preparing','ready','completed','rejected','cancelled')),
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  advance_percent integer not null default 50,
  advance_paid_cents integer not null default 0,
  remaining_cents integer not null default 0,
  pickup_date date,
  pickup_time text,
  special_instructions text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select to authenticated using (auth.uid() = user_id or is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update to authenticated using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id or is_admin());

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete to authenticated using (is_admin());

-- ============================================================
-- order_items
-- ============================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  bouquet_id uuid references public.bouquets(id) on delete set null,
  custom_bouquet_id uuid references public.custom_bouquets(id) on delete set null,
  name text not null,
  image_url text,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  total_price_cents integer not null default 0,
  metadata jsonb default '{}'
);

create index if not exists idx_order_items_order on public.order_items(order_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_delete_admin" on public.order_items;
create policy "order_items_delete_admin" on public.order_items
  for delete to authenticated using (is_admin());

-- ============================================================
-- payments
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount_cents integer not null default 0,
  type text not null default 'advance' check (type in ('advance','remaining','full')),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_order on public.payments(order_id);

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = payments.order_id and (o.user_id = auth.uid() or is_admin()))
  );

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = payments.order_id and o.user_id = auth.uid())
  );

drop policy if exists "payments_update_admin" on public.payments;
create policy "payments_update_admin" on public.payments
  for update to authenticated using (is_admin()) with check (is_admin());

-- ============================================================
-- notifications
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp','in_app')),
  subject text,
  message text,
  status text not null default 'sent' check (status in ('queued','sent','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (auth.uid() = user_id or is_admin());

drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin" on public.notifications
  for insert to authenticated with check (is_admin());

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_bouquets_updated on public.bouquets;
create trigger trg_bouquets_updated before update on public.bouquets
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.handle_updated_at();
