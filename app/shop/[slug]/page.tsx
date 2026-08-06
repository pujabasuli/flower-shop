import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Bouquet, Review } from '@/types';
import { SiteLayout } from '@/components/layout/site-layout';
import { ProductDetail } from '@/features/product/product-detail';

export const revalidate = 60;

async function getBouquet(slug: string) {
  const { data, error } = await supabase
    .from('bouquets')
    .select(
      '*, category:categories(*), images:bouquet_images(*), occasions:bouquet_occasions(occasion:occasions(*)), reviews:reviews(*, profile:profiles(full_name))'
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Bouquet & { reviews: Review[] };
}

async function getRelated(bouquet: Bouquet) {
  if (!bouquet.category_id) return [];
  const { data } = await supabase
    .from('bouquets')
    .select('*, category:categories(*), images:bouquet_images(*)')
    .eq('category_id', bouquet.category_id)
    .neq('id', bouquet.id)
    .eq('is_active', true)
    .limit(4);
  return (data ?? []) as Bouquet[];
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const bouquet = await getBouquet(params.slug);
  if (!bouquet) notFound();
  const related = await getRelated(bouquet);

  return (
    <SiteLayout>
      <ProductDetail bouquet={bouquet} related={related} />
    </SiteLayout>
  );
}
