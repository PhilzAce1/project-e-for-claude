import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { productId, metadata, userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data: price, error } = await supabase
      .from('prices')
      .select('*')
      .eq('product_id', productId)
      .eq('active', true)
      .single();

    if (error) {
      throw error;
    }

    const priceWithMetadata = {
      ...price,
      metadata: {
        user_id: userId,
        keyword: metadata.keyword,
        search_volume: metadata.search_volume,
        competition: metadata.competition,
        main_intent: metadata.main_intent
      }
    };

    return NextResponse.json({ price: priceWithMetadata });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error fetching price' },
      { status: 500 }
    );
  }
}
