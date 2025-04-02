import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { refreshGoogleToken, getGoogleConnection } from '@/utils/googleAuth';

interface KeywordData {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  page: string;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') || getDefaultStartDate();
    const endDate = url.searchParams.get('endDate') || getDefaultEndDate();
    const siteUrl = url.searchParams.get('siteUrl');

    if (!siteUrl) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get GSC connection
    const gscConnection = await getGoogleConnection(supabase, user.id, 'searchConsole');

    if (!gscConnection) {
      return NextResponse.json(
        { error: 'No Google Search Console connection found' },
        { status: 400 },
      );
    }

    // Set up oauth client with refreshed token
    const oauth2Client = await refreshGoogleToken(
      gscConnection.access_token,
      gscConnection.refresh_token,
      gscConnection.expires_at,
      'searchConsole',
      user.id,
      supabase,
    );

    // Initialize Search Console API
    const searchConsole = google.searchconsole('v1');

    // Fetch keyword data
    const response = await searchConsole.searchanalytics.query({
      auth: oauth2Client,
      siteUrl: siteUrl,
      requestBody: {
        startDate: startDate,
        endDate: endDate,
        dimensions: ['query', 'page'],
        rowLimit: 5000, // Get maximum data
      },
    });

    if (!response.data.rows) {
      return NextResponse.json({ keywords: [] });
    }

    // Process keyword data
    const keywords: KeywordData[] = response.data.rows.map((row) => {
      return {
        keyword: row.keys?.[0] || '',
        page: row.keys?.[1] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      };
    });

    // Store in the database
    const { error: dbError } = await supabase.from('keyword_data').upsert(
      keywords.map((keyword) => ({
        user_id: user.id,
        site_url: siteUrl,
        keyword: keyword.keyword,
        page: keyword.page,
        clicks: keyword.clicks,
        impressions: keyword.impressions,
        ctr: keyword.ctr,
        position: keyword.position,
        fetched_at: new Date().toISOString(),
      })),
    );

    if (dbError) {
      console.error('Error storing keyword data:', dbError);
    }

    return NextResponse.json({ keywords });
  } catch (error: any) {
    console.error('Error fetching GSC data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch keyword data',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Helper functions
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30); // Last 30 days
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1); // Yesterday
  return date.toISOString().split('T')[0];
}
