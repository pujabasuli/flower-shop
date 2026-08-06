import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Review } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bouquetId, rating, comment } = body as {
      bouquetId: string;
      rating: number;
      comment: string;
    };

    if (!bouquetId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        bouquet_id: bouquetId,
        user_id: user.id,
        rating,
        comment: comment ?? null,
      })
      .select('*, profile:profiles(full_name)')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data as Review });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
