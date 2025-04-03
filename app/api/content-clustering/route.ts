// app/api/content-clustering/route.ts
import { NextResponse } from 'next/server';
import {
  createClientComponentClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { KeywordClusterer } from '@/utils/KeywordClusterer';

interface ClusteringRequestBody {
  siteUrl: string;
  minSimilarity?: number;
  user_id: string;
}

export async function POST(req: Request) {
  try {
    const body: ClusteringRequestBody = await req.json();
    const { siteUrl, minSimilarity, user_id } = body;

    if (!siteUrl) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 });
    }

    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: keywordData, error: keywordError } = await supabase
      .from('keyword_data')
      .select('id')
      .eq('user_id', user.id)
      .eq('site_url', siteUrl)
      .limit(1);

    if (keywordError) {
      return NextResponse.json(
        { error: 'Error checking keywords', details: keywordError.message },
        { status: 500 },
      );
    }

    if (!keywordData || keywordData.length === 0) {
      return NextResponse.json(
        { error: 'No keywords found for this site. Please fetch keywords first.' },
        { status: 400 },
      );
    }

    const clusterer = new KeywordClusterer(supabase, user.id, siteUrl, minSimilarity || 0.3);

    clusterer
      .createClusters()
      .then((clusters) => {
        console.log(`Clustering completed for ${siteUrl}. Created ${clusters.length} clusters.`);
      })
      .catch((error) => {
        console.error(`Clustering failed for ${siteUrl}:`, error);
      });

    return NextResponse.json({
      success: true,
      message: 'Keyword clustering started successfully',
      status: 'processing',
    });
  } catch (error: any) {
    console.error('Error starting clustering:', error);
    return NextResponse.json(
      {
        error: 'Failed to start clustering',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get('siteUrl');

    if (!siteUrl) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 });
    }

    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: clusters, error: clustersError } = await supabase
      .from('keyword_clusters')
      .select(
        `
        id,
        cluster_name,
        created_at,
        keyword_cluster_mappings (
          id,
          keyword,
          relevance_score
        )
      `,
      )
      .eq('user_id', user.id)
      .eq('site_url', siteUrl);

    if (clustersError) {
      return NextResponse.json(
        { error: 'Failed to retrieve clusters', details: clustersError.message },
        { status: 500 },
      );
    }

    const clustersWithCoverage = await Promise.all(
      clusters.map(async (cluster) => {
        const { data: contentMappings, error: mappingsError } = await supabase
          .from('content_cluster_mappings')
          .select(
            `
          coverage_score,
          content_inventory (
            id,
            page_url,
            title
          )
        `,
          )
          .eq('cluster_id', cluster.id);

        if (mappingsError) {
          console.error('Error getting content mappings:', mappingsError);
          return {
            ...cluster,
            contentCoverage: [],
            averageCoverage: 0,
          };
        }

        const averageCoverage =
          contentMappings && contentMappings.length > 0
            ? contentMappings.reduce((sum, item) => sum + item.coverage_score, 0) /
              contentMappings.length
            : 0;

        return {
          ...cluster,
          contentCoverage: contentMappings || [],
          averageCoverage,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      clusters: clustersWithCoverage,
    });
  } catch (error: any) {
    console.error('Error retrieving clusters:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve clusters',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
