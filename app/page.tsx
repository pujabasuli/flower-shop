import { supabase } from '@/lib/supabase';
import type { Bouquet, Category, Review } from '@/types';
import { SiteLayout } from '@/components/layout/site-layout';
import { Hero } from '@/components/sections/hero';
import { FeaturedBouquets } from '@/components/sections/featured-bouquets';
import { CategoriesSection } from '@/components/sections/categories-section';
import { AboutSection } from '@/components/sections/about-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';

export const revalidate = 60;

async function getLandingData() {
  const [bouquetsRes, categoriesRes, reviewsRes] = await Promise.all([
    supabase
      .from('bouquets')
      .select('*, category:categories(*), images:bouquet_images(*)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('categories').select('*').order('name'),
    supabase.from('reviews').select('rating, bouquet_id'),
  ]);

  const reviewsByBouquet = new Map<string, Review[]>();
  (reviewsRes.data ?? []).forEach((r) => {
    const list = reviewsByBouquet.get(r.bouquet_id) ?? [];
    list.push(r as Review);
    reviewsByBouquet.set(r.bouquet_id, list);
  });

  const bouquets = (bouquetsRes.data ?? []).map((b) => ({
    ...b,
    reviews: reviewsByBouquet.get(b.id) ?? [],
  })) as Bouquet[];

  return {
    bouquets,
    categories: categoriesRes.data as Category[],
  };
}

export default async function Home() {
  const { bouquets, categories } = await getLandingData();

  return (
    <SiteLayout>
      <Hero />
      <FeaturedBouquets bouquets={bouquets} />
      <CategoriesSection categories={categories} />
      <AboutSection />
      <TestimonialsSection />
    </SiteLayout>
  );
}
