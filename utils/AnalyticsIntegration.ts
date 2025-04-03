// lib/AnalyticsIntegration.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { refreshGoogleToken } from '../utils/googleAuth';

interface AnalyticsOptions {
  startDate: string;
  endDate: string;
  dimensions?: string[];
  metrics?: string[];
  pageSize?: number;
}

interface PageAnalytics {
  pageUrl: string;
  pageviews: number;
  uniquePageviews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  exitRate: number;
  date: string;
}

export class AnalyticsIntegration {
  private supabase: SupabaseClient;
  private userId: string;
  private oauth2Client: OAuth2Client | null = null;

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Initialize analytics client with OAuth credentials
   */
  async initialize(): Promise<boolean> {
    // Get Google Analytics connection
    const { data, error } = await this.supabase
      .from('ga_connections')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error || !data) {
      console.error('Error fetching GA connection:', error);
      return false;
    }

    // Set up OAuth client with refreshed token
    try {
      this.oauth2Client = await refreshGoogleToken(
        data.access_token,
        data.refresh_token,
        data.expires_at,
        'analytics',
        this.userId,
        this.supabase,
      );
      return true;
    } catch (error) {
      console.error('Error initializing analytics client:', error);
      return false;
    }
  }

  private async generateMockAnalyticsData(options: AnalyticsOptions): Promise<PageAnalytics[]> {
    const mockData: PageAnalytics[] = [];
    const startDate = new Date(options.startDate);
    const endDate = new Date(options.endDate);

    // First, fetch the actual URLs from the content inventory
    const { data: contentItems, error: contentError } = await this.supabase
      .from('content_inventory')
      .select('id, page_url')
      .eq('user_id', this.userId);

    if (contentError) {
      console.error('Error fetching content inventory for mock data:', contentError);
      // Return empty data if we can't get content inventory
      return [];
    }

    // If there are no content items, use some sample URLs
    const urls =
      contentItems && contentItems.length > 0
        ? contentItems.map((item) => item.page_url)
        : [
            'https://example.com/',
            'https://example.com/about',
            'https://example.com/blog',
            'https://example.com/contact',
            'https://example.com/products',
            'https://example.com/services',
          ];

    // Generate data for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];

      // Generate data for each URL in the content inventory
      urls.forEach((url) => {
        mockData.push({
          pageUrl: url,
          date: dateString,
          pageviews: Math.floor(Math.random() * 100) + 10, // 10-110
          uniquePageviews: Math.floor(Math.random() * 80) + 5, // 5-85
          avgTimeOnPage: Math.floor(Math.random() * 180) + 20, // 20-200 seconds
          bounceRate: Math.random() * 50, // 0-50%
          exitRate: Math.random() * 40, // 0-40%
        });
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return mockData;
  }
  async fetchAnalyticsData(
    propertyId: string,
    options: AnalyticsOptions,
  ): Promise<PageAnalytics[]> {
    if (!this.oauth2Client) {
      await this.initialize();

      if (!this.oauth2Client) {
        throw new Error('Failed to initialize analytics client');
      }
    }

    // Extract just the numeric part if propertyId contains the "properties/" prefix
    const formattedPropertyId = propertyId.includes('/') ? propertyId.split('/').pop() : propertyId;

    // Set up Google Analytics Data API client
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth: this.oauth2Client,
    });

    try {
      // Create report request
      const request = {
        property: `properties/${formattedPropertyId}`,
        dateRanges: [
          {
            startDate: options.startDate,
            endDate: options.endDate,
          },
        ],
        dimensions: (options.dimensions || ['date', 'pagePath']).map((name) => ({ name })),
        metrics: (
          options.metrics || [
            'screenPageViews',
            'sessions',
            'averageSessionDuration',
            'bounceRate',
            'eventsPerSession',
          ]
        ).map((name) => ({ name })),
        limit: options.pageSize?.toString() || '10000',
      };

      // Run the report
      const response = await analyticsData.properties.runReport({
        property: `properties/${formattedPropertyId}`,
        requestBody: request,
      });

      // For development - if no data is returned from GA, use mock data
      // Remove this in production!
      if (!response.data.rows || response.data.rows.length === 0) {
        return [];
      }

      const results: PageAnalytics[] = [];
      const dimensionHeaders = response.data.dimensionHeaders || [];
      const metricHeaders = response.data.metricHeaders || [];

      response.data.rows.forEach((row) => {
        if (!row.dimensionValues || !row.metricValues) {
          return;
        }

        // Get index of each dimension and metric
        const dateIndex = dimensionHeaders.findIndex((h) => h.name === 'date');
        const pagePathIndex = dimensionHeaders.findIndex((h) => h.name === 'pagePath');
        const pageviewsIndex = metricHeaders.findIndex((h) => h.name === 'screenPageViews');
        const uniquePageviewsIndex = metricHeaders.findIndex((h) => h.name === 'sessions');
        const avgTimeOnPageIndex = metricHeaders.findIndex(
          (h) => h.name === 'averageSessionDuration',
        );
        const bounceRateIndex = metricHeaders.findIndex((h) => h.name === 'bounceRate');
        const exitRateIndex = metricHeaders.findIndex((h) => h.name === 'eventsPerSession');

        // Extract values
        const date = dateIndex >= 0 ? row.dimensionValues[dateIndex].value || '' : '';
        const pagePath = pagePathIndex >= 0 ? row.dimensionValues[pagePathIndex].value || '' : '';
        const pageviews =
          pageviewsIndex >= 0 ? parseFloat(row.metricValues[pageviewsIndex].value || '0') : 0;
        const uniquePageviews =
          uniquePageviewsIndex >= 0
            ? parseFloat(row.metricValues[uniquePageviewsIndex].value || '0')
            : 0;
        const avgTimeOnPage =
          avgTimeOnPageIndex >= 0
            ? parseFloat(row.metricValues[avgTimeOnPageIndex].value || '0')
            : 0;
        const bounceRate =
          bounceRateIndex >= 0 ? parseFloat(row.metricValues[bounceRateIndex].value || '0') : 0;
        const exitRate =
          exitRateIndex >= 0 ? parseFloat(row.metricValues[exitRateIndex].value || '0') : 0;

        results.push({
          pageUrl: pagePath,
          pageviews,
          uniquePageviews,
          avgTimeOnPage,
          bounceRate,
          exitRate,
          date,
        });
      });

      return results;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  /**
   * Store analytics data for content inventory
   */
  async storeAnalyticsData(analytics: PageAnalytics[]): Promise<void> {
    if (analytics.length === 0) {
      return;
    }

    // Get content inventory items to map URLs to content IDs
    const { data: contentItems, error: contentError } = await this.supabase
      .from('content_inventory')
      .select('id, page_url')
      .eq('user_id', this.userId);

    if (contentError) {
      console.error('Error fetching content inventory:', contentError);
      throw contentError;
    }

    // Create a map of page URLs to content IDs
    const contentMap = new Map<string, string>();
    contentItems?.forEach((item) => {
      contentMap.set(item.page_url, item.id);
    });

    // Prepare analytics records to insert
    const analyticsRecords = [];

    for (const item of analytics) {
      // Find content ID for this page URL
      const contentId = contentMap.get(item.pageUrl);

      // Skip if we can't map this URL to a content item
      if (!contentId) {
        continue;
      }

      analyticsRecords.push({
        content_id: contentId,
        date: item.date,
        pageviews: item.pageviews,
        unique_pageviews: item.uniquePageviews,
        avg_time_on_page: item.avgTimeOnPage,
        bounce_rate: item.bounceRate,
        exit_rate: item.exitRate,
      });
    }

    // Insert analytics records
    if (analyticsRecords.length > 0) {
      const { error: insertError } = await this.supabase
        .from('content_analytics_history')
        .upsert(analyticsRecords);

      if (insertError) {
        console.error('Error inserting analytics records:', insertError);
        throw insertError;
      }
    }
  }

  /**
   * Update analytics for all content inventory
   */
  async updateAllContentAnalytics(propertyId: string, days: number = 10): Promise<boolean> {
    // Extract just the numeric part if propertyId contains the "properties/" prefix
    const formattedPropertyId = propertyId.includes('/')
      ? propertyId.split('/').pop() || propertyId
      : propertyId;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const options: AnalyticsOptions = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['date', 'pagePath'],
      metrics: [
        'screenPageViews',
        'sessions',
        'averageSessionDuration',
        'bounceRate',
        'eventsPerSession',
      ],
      pageSize: 10000,
    };

    try {
      // Fetch analytics data
      const analyticsData = await this.fetchAnalyticsData(formattedPropertyId, options);

      // Store analytics data
      await this.storeAnalyticsData(analyticsData);

      return true;
    } catch (error) {
      console.error('Error updating content analytics:', error);
      return false;
    }
  }
  /**
   * Get analytics for a specific content item
   */
  async getContentAnalytics(contentId: string, days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('content_analytics_history')
      .select('*')
      .eq('content_id', contentId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching content analytics:', error);
      throw error;
    }

    // Calculate summary
    const summary = {
      totalPageviews: 0,
      totalUniquePageviews: 0,
      avgTimeOnPage: 0,
      avgBounceRate: 0,
      avgExitRate: 0,
      dailyData: data || [],
    };

    if (data && data.length > 0) {
      summary.totalPageviews = data.reduce((sum, item) => sum + item.pageviews, 0);
      summary.totalUniquePageviews = data.reduce((sum, item) => sum + item.unique_pageviews, 0);
      summary.avgTimeOnPage =
        data.reduce((sum, item) => sum + item.avg_time_on_page, 0) / data.length;
      summary.avgBounceRate = data.reduce((sum, item) => sum + item.bounce_rate, 0) / data.length;
      summary.avgExitRate = data.reduce((sum, item) => sum + item.exit_rate, 0) / data.length;
    }

    return summary;
  }

  /**
   * Calculate performance score for content based on analytics
   */
  async calculateContentPerformanceScore(contentId: string): Promise<number> {
    try {
      const analytics = await this.getContentAnalytics(contentId, 30);

      if (!analytics || analytics.dailyData.length === 0) {
        return 0;
      }

      // Calculate score based on various metrics
      // Higher pageviews and time on page increase score
      // Higher bounce rate and exit rate decrease score
      const pageviewsScore = Math.min(analytics.totalPageviews / 100, 1) * 40;
      const timeOnPageScore = Math.min(analytics.avgTimeOnPage / 120, 1) * 30;
      const bounceRateScore = (1 - Math.min(analytics.avgBounceRate / 100, 1)) * 20;
      const exitRateScore = (1 - Math.min(analytics.avgExitRate / 100, 1)) * 10;

      // Combine scores (0-100 scale)
      const totalScore = pageviewsScore + timeOnPageScore + bounceRateScore + exitRateScore;

      return Math.round(totalScore);
    } catch (error) {
      console.error('Error calculating performance score:', error);
      return 0;
    }
  }
}
