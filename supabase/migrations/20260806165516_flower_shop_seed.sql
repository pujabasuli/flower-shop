/*
# Flower Shop — Seed Catalog Data

## Overview
Populates catalog tables with initial data so the storefront has real content:
- Categories (Wedding, Birthday, Sympathy, Romance, Spring)
- Occasions (Anniversary, Birthday, Congratulations, Get Well, Love, Sympathy, Wedding)
- Bouquets (12 products across categories with real images)
- Bouquet images, bouquet-occasion links
- Flowers, wrapping papers, ribbons, greeting cards, gift addons (for custom builder)
- Pickup slots (next 7 days, 3 slots per day)
- Coupons (WELCOME10, BLOOM15)

Idempotent: uses ON CONFLICT to skip existing rows.
*/

-- ============================================================
-- Categories
-- ============================================================
insert into public.categories (name, slug, description, image_url) values
  ('Wedding', 'wedding', 'Elegant bridal bouquets and wedding florals', 'https://images.pexels.com/photos/667320/pexels-photo-667320.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Birthday', 'birthday', 'Bright and cheerful birthday bouquets', 'https://images.pexels.com/photos/35421156/pexels-photo-35421156.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Sympathy', 'sympathy', 'Thoughtful arrangements for remembrance', 'https://images.pexels.com/photos/8963952/pexels-photo-8963952.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Romance', 'romance', 'Romantic roses and love-inspired bouquets', 'https://images.pexels.com/photos/11196806/pexels-photo-11196806.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Spring', 'spring', 'Fresh seasonal spring flowers', 'https://images.pexels.com/photos/30734753/pexels-photo-30734753.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
on conflict (slug) do nothing;

-- ============================================================
-- Occasions
-- ============================================================
insert into public.occasions (name, slug) values
  ('Anniversary', 'anniversary'),
  ('Birthday', 'birthday'),
  ('Congratulations', 'congratulations'),
  ('Get Well', 'get-well'),
  ('Love', 'love'),
  ('Sympathy', 'sympathy'),
  ('Wedding', 'wedding')
on conflict (slug) do nothing;

-- ============================================================
-- Bouquets
-- ============================================================
do $$
declare
  cat_wedding uuid; cat_birthday uuid; cat_sympathy uuid; cat_romance uuid; cat_spring uuid;
begin
  select id into cat_wedding from public.categories where slug='wedding';
  select id into cat_birthday from public.categories where slug='birthday';
  select id into cat_sympathy from public.categories where slug='sympathy';
  select id into cat_romance from public.categories where slug='romance';
  select id into cat_spring from public.categories where slug='spring';

  -- Blushing Peony Dream
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Blushing Peony Dream', 'blushing-peony-dream', 'A lush arrangement of blush pink peonies with eucalyptus accents, wrapped in soft cream paper. Perfect for anniversaries and romantic gestures.', 8900, 45, 15, true, true, cat_romance, 'Pink Peonies, Eucalyptus, Baby''s Breath')
  on conflict (slug) do nothing;

  -- Eternal White Vows
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Eternal White Vows', 'eternal-white-vows', 'A timeless bridal bouquet of white roses and lilies with silver dollar eucalyptus. Designed for the walk down the aisle.', 12900, 90, 8, true, true, cat_wedding, 'White Roses, Calla Lilies, Silver Eucalyptus')
  on conflict (slug) do nothing;

  -- Crimson Romance
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Crimson Romance', 'crimson-romance', 'Two dozen deep red roses with baby''s breath, wrapped in luxury paper with a satin ribbon. The classic expression of love.', 9900, 30, 25, true, true, cat_romance, 'Red Roses, Baby''s Breath, Eucalyptus')
  on conflict (slug) do nothing;

  -- Spring Awakening
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Spring Awakening', 'spring-awakening', 'A cheerful mix of seasonal tulips and wildflowers in pastel hues. Brings the freshness of spring indoors.', 5900, 30, 30, true, true, cat_spring, 'Tulips, Daffodils, Wildflowers, Asters')
  on conflict (slug) do nothing;

  -- Sunny Disposition
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Sunny Disposition', 'sunny-disposition', 'Bright sunflowers with purple accents in a rustic basket. Guaranteed to bring a smile for any birthday.', 6900, 25, 20, true, true, cat_birthday, 'Sunflowers, Purple Asters, Solidago')
  on conflict (slug) do nothing;

  -- Garden of Serenity
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Garden of Serenity', 'garden-of-serenity', 'A graceful arrangement of white lilies and chrysanthemums for moments of remembrance and sympathy.', 7500, 40, 12, false, true, cat_sympathy, 'White Lilies, White Chrysanthemums, Fern')
  on conflict (slug) do nothing;

  -- Rose Quartz Blush
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Rose Quartz Blush', 'rose-quartz-blush', 'Soft pink roses arranged in a crystal vase with delicate greenery. A versatile gift for any occasion.', 7900, 35, 18, true, true, cat_birthday, 'Pink Roses, Baby''s Breath, Leather Leaf')
  on conflict (slug) do nothing;

  -- Wildflower Meadow
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Wildflower Meadow', 'wildflower-meadow', 'A free-spirited bouquet of mixed wildflowers and daisies in a glass jar. Rustic charm at its finest.', 4900, 20, 35, false, true, cat_spring, 'Daisies, Cornflowers, Wildflowers, Lavender')
  on conflict (slug) do nothing;

  -- Pink Champagne
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Pink Champagne', 'pink-champagne', 'Sparkling pink roses with cream accents in an elegant crystal vase. Toast to life''s beautiful moments.', 9500, 40, 14, true, true, cat_wedding, 'Pink Roses, Cream Roses, Eucalyptus')
  on conflict (slug) do nothing;

  -- Velvet Sunset
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Velvet Sunset', 'velvet-sunset', 'Warm-toned roses in amber and coral, arranged with dusty miller for a dramatic golden-hour glow.', 8500, 35, 16, false, true, cat_romance, 'Coral Roses, Amber Roses, Dusty Miller')
  on conflict (slug) do nothing;

  -- Pure Devotion
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Pure Devotion', 'pure-devotion', 'A serene all-white arrangement of roses, lilies, and carnations. Elegant for sympathy or celebration.', 8200, 45, 10, false, true, cat_sympathy, 'White Roses, White Lilies, White Carnations')
  on conflict (slug) do nothing;

  -- Birthday Confetti
  insert into public.bouquets (name, slug, description, price_cents, prep_time_minutes, stock, is_featured, is_active, category_id, flowers_included)
  values ('Birthday Confetti', 'birthday-confetti', 'A vibrant burst of colorful daisies, asters, and seasonal blooms. The life of the party.', 5500, 25, 28, true, true, cat_birthday, 'Mixed Daisies, Asters, Solidago, Tulips')
  on conflict (slug) do nothing;
end $$;

-- ============================================================
-- Bouquet Images
-- ============================================================
do $$
declare
  b uuid;
begin
  -- Blushing Peony Dream
  select id into b from public.bouquets where slug='blushing-peony-dream';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/8244712/pexels-photo-8244712.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/33955699/pexels-photo-33955699.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
    (b, 'https://images.pexels.com/photos/3392982/pexels-photo-3392982.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2)
  on conflict do nothing;

  -- Eternal White Vows
  select id into b from public.bouquets where slug='eternal-white-vows';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/667320/pexels-photo-667320.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/16528472/pexels-photo-16528472.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1)
  on conflict do nothing;

  -- Crimson Romance
  select id into b from public.bouquets where slug='crimson-romance';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/11196806/pexels-photo-11196806.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/22604232/pexels-photo-22604232.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
    (b, 'https://images.pexels.com/photos/35568784/pexels-photo-35568784.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2)
  on conflict do nothing;

  -- Spring Awakening
  select id into b from public.bouquets where slug='spring-awakening';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/30734753/pexels-photo-30734753.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/37423023/pexels-photo-37423023.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1)
  on conflict do nothing;

  -- Sunny Disposition
  select id into b from public.bouquets where slug='sunny-disposition';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/712098/pexels-photo-712098.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/17564251/pexels-photo-17564251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1)
  on conflict do nothing;

  -- Garden of Serenity
  select id into b from public.bouquets where slug='garden-of-serenity';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/8963952/pexels-photo-8963952.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/8865421/pexels-photo-8865421.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1)
  on conflict do nothing;

  -- Rose Quartz Blush
  select id into b from public.bouquets where slug='rose-quartz-blush';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/6955468/pexels-photo-6955468.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/11069938/pexels-photo-11069938.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
    (b, 'https://images.pexels.com/photos/3910065/pexels-photo-3910065.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2)
  on conflict do nothing;

  -- Wildflower Meadow
  select id into b from public.bouquets where slug='wildflower-meadow';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/35421156/pexels-photo-35421156.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0)
  on conflict do nothing;

  -- Pink Champagne
  select id into b from public.bouquets where slug='pink-champagne';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/30891127/pexels-photo-30891127.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/38008427/pexels-photo-38008427.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1)
  on conflict do nothing;

  -- Velvet Sunset
  select id into b from public.bouquets where slug='velvet-sunset';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/32740383/pexels-photo-32740383.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/19454005/pexels-photo-19454005.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1)
  on conflict do nothing;

  -- Pure Devotion
  select id into b from public.bouquets where slug='pure-devotion';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/8963873/pexels-photo-8963873.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/8865115/pexels-photo-8865115.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1)
  on conflict do nothing;

  -- Birthday Confetti
  select id into b from public.bouquets where slug='birthday-confetti';
  insert into public.bouquet_images (bouquet_id, image_url, position) values
    (b, 'https://images.pexels.com/photos/7311450/pexels-photo-7311450.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
    (b, 'https://images.pexels.com/photos/27094717/pexels-photo-27094717.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1)
  on conflict do nothing;
end $$;

-- ============================================================
-- Bouquet Occasions
-- ============================================================
do $$
declare
  b uuid; o uuid;
begin
  -- Blushing Peony Dream -> Love, Anniversary
  select id into b from public.bouquets where slug='blushing-peony-dream';
  select id into o from public.occasions where slug='love';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='anniversary';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Eternal White Vows -> Wedding
  select id into b from public.bouquets where slug='eternal-white-vows';
  select id into o from public.occasions where slug='wedding';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Crimson Romance -> Love, Anniversary
  select id into b from public.bouquets where slug='crimson-romance';
  select id into o from public.occasions where slug='love';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='anniversary';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Spring Awakening -> Birthday, Congratulations, Get Well
  select id into b from public.bouquets where slug='spring-awakening';
  select id into o from public.occasions where slug='birthday';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='congratulations';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='get-well';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Sunny Disposition -> Birthday, Get Well
  select id into b from public.bouquets where slug='sunny-disposition';
  select id into o from public.occasions where slug='birthday';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='get-well';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Garden of Serenity -> Sympathy
  select id into b from public.bouquets where slug='garden-of-serenity';
  select id into o from public.occasions where slug='sympathy';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Rose Quartz Blush -> Birthday, Love, Anniversary
  select id into b from public.bouquets where slug='rose-quartz-blush';
  select id into o from public.occasions where slug='birthday';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='love';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='anniversary';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Wildflower Meadow -> Birthday, Congratulations
  select id into b from public.bouquets where slug='wildflower-meadow';
  select id into o from public.occasions where slug='birthday';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='congratulations';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Pink Champagne -> Wedding, Anniversary, Congratulations
  select id into b from public.bouquets where slug='pink-champagne';
  select id into o from public.occasions where slug='wedding';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='anniversary';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='congratulations';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Velvet Sunset -> Love, Anniversary
  select id into b from public.bouquets where slug='velvet-sunset';
  select id into o from public.occasions where slug='love';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='anniversary';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Pure Devotion -> Sympathy, Wedding
  select id into b from public.bouquets where slug='pure-devotion';
  select id into o from public.occasions where slug='sympathy';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='wedding';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;

  -- Birthday Confetti -> Birthday, Congratulations
  select id into b from public.bouquets where slug='birthday-confetti';
  select id into o from public.occasions where slug='birthday';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
  select id into o from public.occasions where slug='congratulations';
  insert into public.bouquet_occasions (bouquet_id, occasion_id) values (b, o) on conflict do nothing;
end $$;

-- ============================================================
-- Flowers (for custom builder)
-- ============================================================
insert into public.flowers (name, color, price_cents, stock, is_active) values
  ('Red Rose', 'Red', 250, 200, true),
  ('Pink Rose', 'Pink', 250, 180, true),
  ('White Rose', 'White', 250, 150, true),
  ('Peony', 'Blush Pink', 400, 80, true),
  ('Tulip', 'Mixed', 150, 220, true),
  ('Sunflower', 'Yellow', 200, 120, true),
  ('Lily', 'White', 300, 90, true),
  ('Carnation', 'Pink', 120, 160, true),
  ('Baby''s Breath', 'White', 80, 300, true),
  ('Eucalyptus', 'Green', 100, 250, true),
  ('Daisy', 'White/Yellow', 90, 200, true),
  ('Lavender', 'Purple', 110, 140, true)
on conflict do nothing;

-- ============================================================
-- Wrapping Papers
-- ============================================================
insert into public.wrapping_papers (name, color, price_cents, stock, is_active) values
  ('Kraft Brown', 'Brown', 150, 100, true),
  ('Soft Cream', 'Cream', 200, 80, true),
  ('Blush Pink', 'Pink', 200, 75, true),
  ('White Satin', 'White', 250, 60, true),
  ('Black Luxury', 'Black', 250, 50, true),
  ('Pastel Mint', 'Mint', 200, 70, true)
on conflict do nothing;

-- ============================================================
-- Ribbons
-- ============================================================
insert into public.ribbons (name, color, price_cents, stock, is_active) values
  ('Silk Pink', 'Pink', 80, 200, true),
  ('Satin White', 'White', 80, 180, true),
  ('Velvet Red', 'Red', 100, 150, true),
  ('Organza Gold', 'Gold', 120, 120, true),
  ('Lace Cream', 'Cream', 100, 100, true),
  ('Sage Green', 'Green', 80, 160, true)
on conflict do nothing;

-- ============================================================
-- Greeting Cards
-- ============================================================
insert into public.greeting_cards (name, design, price_cents, stock, is_active) values
  ('Love Note', 'Minimalist heart', 150, 100, true),
  ('Birthday Wishes', 'Colorful confetti', 150, 120, true),
  ('Wedding Bells', 'Elegant gold foil', 200, 80, true),
  ('Sympathy', 'Soft watercolor', 150, 60, true),
  ('Blank Canvas', 'No text', 100, 150, true),
  ('Thank You', 'Floral border', 150, 90, true)
on conflict do nothing;

-- ============================================================
-- Gift Addons
-- ============================================================
insert into public.gift_addons (name, type, price_cents, stock, is_active) values
  ('Belgian Chocolate Box', 'chocolate', 1200, 50, true),
  ('Dark Chocolate Truffles', 'chocolate', 1500, 40, true),
  ('Plush Teddy Bear (Small)', 'teddy', 800, 60, true),
  ('Plush Teddy Bear (Large)', 'teddy', 1500, 30, true),
  ('Glass Vase (Medium)', 'vase', 600, 80, true),
  ('Crystal Vase (Large)', 'vase', 1800, 25, true),
  ('Scented Candle Set', 'other', 900, 70, true)
on conflict do nothing;

-- ============================================================
-- Pickup Slots (next 7 days, 3 slots per day)
-- ============================================================
insert into public.pickup_slots (date, start_time, end_time, max_orders, is_active)
select
  (current_date + n)::date,
  '10:00'::time, '12:00'::time, 10, true
from generate_series(0,6) as n
on conflict do nothing;

insert into public.pickup_slots (date, start_time, end_time, max_orders, is_active)
select
  (current_date + n)::date,
  '13:00'::time, '15:00'::time, 10, true
from generate_series(0,6) as n
on conflict do nothing;

insert into public.pickup_slots (date, start_time, end_time, max_orders, is_active)
select
  (current_date + n)::date,
  '16:00'::time, '18:00'::time, 10, true
from generate_series(0,6) as n
on conflict do nothing;

-- ============================================================
-- Coupons
-- ============================================================
insert into public.coupons (code, discount_percent, is_active) values
  ('WELCOME10', 10, true),
  ('BLOOM15', 15, true)
on conflict (code) do nothing;
