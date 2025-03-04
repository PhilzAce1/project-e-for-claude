import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { syncSitemapContent } from '@/utils/site-map-helper/sitemap-sync';

const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { domain, userId } = await request.json();

    if (!domain || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify user exists and has permission
    const { data: user, error: userError } = await serviceRoleClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found or unauthorized' },
        { status: 401 }
      );
    }

    // Perform sitemap sync
    const result = await syncSitemapContent(domain, userId);

    return NextResponse.json({
      message: 'Sitemap sync completed',
      result
    });

  } catch (error) {
    console.error('Sitemap sync failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 