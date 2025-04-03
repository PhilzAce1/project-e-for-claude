// app/api/content-inventory/export/route.ts
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
    const format = url.searchParams.get('format') || 'csv';
    const includeAnalytics = url.searchParams.get('includeAnalytics') === 'true';
    const includeClusters = url.searchParams.get('includeClusters') === 'true';
    const includeKeywords = url.searchParams.get('includeKeywords') === 'true';
    const user_id = url.searchParams.get('user_id');

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

    // Get content inventory
    const { data, error } = await supabase
      .from('content_inventory')
      .select('*')
      .eq('user_id', user.id)
      .eq('site_url', siteUrl);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to retrieve content inventory', details: error.message },
        { status: 500 },
      );
    }

    // Initialize analytics integration
    const analytics = new AnalyticsIntegration(supabase, user.id);

    // Enhance data with additional information
    const enhancedData = await Promise.all(
      data.map(async (item) => {
        const result: any = {
          pageUrl: item.page_url,
          title: item.title,
          description: item.description,
          h1: item.h1,
          wordCount: item.word_count,
          lastCrawled: item.last_crawled,
        };

        // Add analytics data if requested
        if (includeAnalytics) {
          const analyticsData = await analytics.getContentAnalytics(item.id, 30);
          const performanceScore = await analytics.calculateContentPerformanceScore(item.id);

          result.pageviews = analyticsData.totalPageviews;
          result.uniquePageviews = analyticsData.totalUniquePageviews;
          result.avgTimeOnPage = analyticsData.avgTimeOnPage;
          result.bounceRate = analyticsData.avgBounceRate;
          result.exitRate = analyticsData.avgExitRate;
          result.performanceScore = performanceScore;
        }

        // Add cluster information if requested
        if (includeClusters) {
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

          if (!clusterError && clusterMappings) {
            result.clusters = clusterMappings.map((mapping: any) => ({
              name: mapping.keyword_clusters.cluster_name,
              coverageScore: mapping.coverage_score,
            }));

            // Include cluster names as a comma-separated string
            result.clusterNames = clusterMappings
              .map((mapping: any) => mapping.keyword_clusters.cluster_name)
              .join(', ');

            // Include average coverage score
            result.avgCoverageScore =
              clusterMappings.length > 0
                ? clusterMappings.reduce((sum: number, m: any) => sum + m.coverage_score, 0) /
                  clusterMappings.length
                : 0;
          }
        }

        // Add keyword information if requested
        if (includeKeywords) {
          const { data: keywords, error: keywordsError } = await supabase
            .from('keyword_data')
            .select('keyword, clicks, impressions, position')
            .eq('user_id', user.id)
            .eq('site_url', siteUrl)
            .eq('page', item.page_url)
            .order('clicks', { ascending: false })
            .limit(10);

          if (!keywordsError && keywords) {
            result.topKeywords = keywords.map((k: any) => k.keyword).join(', ');
            result.avgPosition =
              keywords.length > 0
                ? keywords.reduce((sum: number, k: any) => sum + k.position, 0) / keywords.length
                : 0;
            result.totalClicks = keywords.reduce((sum: number, k: any) => sum + k.clicks, 0);
            result.totalImpressions = keywords.reduce(
              (sum: number, k: any) => sum + k.impressions,
              0,
            );
          }
        }

        return result;
      }),
    );

    // Format output based on requested format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: enhancedData,
      });
    } else {
      // Generate CSV
      const csvHeaders = Object.keys(enhancedData[0] || {});
      let csv = csvHeaders.join(',') + '\n';

      enhancedData.forEach((item) => {
        const row = csvHeaders.map((header) => {
          const value = item[header];
          // Handle complex objects by converting to JSON
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          // Handle strings with commas by wrapping in quotes
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value?.toString() || '';
        });
        csv += row.join(',') + '\n';
      });

      // Set content type and filename for download
      const headers = new Headers();
      headers.set('Content-Type', 'text/csv');
      headers.set(
        'Content-Disposition',
        `attachment; filename="content-inventory-${siteUrl.replace(/[^a-z0-9]/gi, '-')}.csv"`,
      );

      return new NextResponse(csv, {
        status: 200,
        headers,
      });
    }
  } catch (error: any) {
    console.error('Error exporting content inventory:', error);
    return NextResponse.json(
      {
        error: 'Failed to export content inventory',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
