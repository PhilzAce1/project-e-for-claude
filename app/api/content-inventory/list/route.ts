// app/api/content-inventory/list/route.ts
import { NextResponse } from 'next/server';
import {
  createClientComponentClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AnalyticsIntegration } from '@/utils/AnalyticsIntegration';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get('siteUrl');
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
    const pageSize = url.searchParams.get('pageSize')
      ? parseInt(url.searchParams.get('pageSize')!)
      : 50;
    const sortBy = url.searchParams.get('sortBy') || 'last_crawled';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const search = url.searchParams.get('search') || '';
    const user_id = url.searchParams.get('user_id') || '';

    if (!siteUrl) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 });
    }

    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const { data: user, error: authError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('content_inventory')
      .select('*, content_analytics_history(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('site_url', siteUrl);

    // Add search if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,page_url.ilike.%${search}%,h1.ilike.%${search}%`);
    }

    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Add sorting
    if (sortBy && ['page_url', 'title', 'word_count', 'last_crawled'].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Execute query with pagination
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to retrieve content inventory', details: error.message },
        { status: 500 },
      );
    }

    // Initialize analytics integration to calculate performance scores
    const analytics = new AnalyticsIntegration(supabase, user.id);

    // Enhance data with performance scores and cluster information
    const enhancedData = await Promise.all(
      data.map(async (item) => {
        // Get performance score
        const performanceScore = await analytics.calculateContentPerformanceScore(item.id);

        // Get content clusters
        const { data: clusterMappings, error: clusterError } = await supabase
          .from('content_cluster_mappings')
          .select(
            `
          coverage_score,
          keyword_clusters (
            id,
            cluster_name
          )
        `,
          )
          .eq('content_id', item.id);

        const clusters =
          clusterError || !clusterMappings
            ? []
            : clusterMappings?.map((mapping) => ({
                clusterId: mapping.keyword_clusters[0]?.id,
                clusterName: mapping.keyword_clusters[0]?.cluster_name,
                coverageScore: mapping.coverage_score,
              })) || [];
        const { data: keywords, error: keywordsError } = await supabase
          .from('keyword_data')
          .select('keyword, clicks, impressions, position')
          .eq('user_id', user.id)
          .eq('site_url', siteUrl)
          .eq('page', item.page_url)
          .order('clicks', { ascending: false })
          .limit(10);

        return {
          ...item,
          performanceScore,
          clusters,
          keywords: keywordsError ? [] : keywords,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: enhancedData,
      total: count || 0,
      page,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
    });
  } catch (error: any) {
    console.error('Error retrieving content inventory:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve content inventory',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
