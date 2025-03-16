import { NextResponse } from 'next/server';
import {
  createClientComponentClient,
  createRouteHandlerClient
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function checkUrlIndexStatus(url: string, accessToken: string) {
  const endpoint =
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

  console.log('accessToken', new URL(url).origin, accessToken);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: new URL(url).origin + '/' // Make sure to include trailing slash
      })
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(`URL Inspection API error: ${JSON.stringify(error)}`);
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const errorText = await response.text();
        throw new Error(
          `URL Inspection API error (${response.status}): ${errorText.substring(0, 200)}`
        );
      }
    }

    const data = await response.json();
    return {
      url,
      isIndexed: data.inspectionResult?.indexStatusResult?.isIndexed ?? false,
      lastModified: data.inspectionResult?.indexStatusResult?.lastCrawlTime
    };
  } catch (error) {
    console.error('Error checking URL index status:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });
    // Get authenticated user
    const { user_id } = await req.json();

    // Get GSC access token
    const { data: gscConnection, error: gscError } = await supabase
      .from('gsc_connections')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (gscError || !gscConnection) {
      return NextResponse.json(
        { error: 'No valid GSC connection found' },
        { status: 400 }
      );
    }

    // Get content URLs that haven't been checked or are not indexed
    const { data: contentUrls, error: contentError } = await supabase
      .from('content')
      .select('id, url, site_indexed, last_modified')
      .eq('user_id', user_id)
      .or('site_indexed.is.null,site_indexed.eq.false')
      .limit(10); // Process in batches to respect API quotas

    if (contentError) {
      return NextResponse.json(
        { error: 'Failed to fetch content URLs' },
        { status: 500 }
      );
    }

    if (!contentUrls || contentUrls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No URLs to check',
        results: []
      });
    }

    // Check indexing status for each URL
    const results = await Promise.allSettled(
      contentUrls.map(({ url }) =>
        checkUrlIndexStatus(url, gscConnection.access_token)
      )
    );

    // Update database with results
    const updates = results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return {
            id: contentUrls[index].id,
            site_indexed: result.value.isIndexed,
            last_modified: result.value.lastModified
          };
        }
        return null;
      })
      .filter(Boolean);

    // Batch update the content table
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('content')
        .upsert(updates);

      if (updateError) {
        console.error('Error updating content index status:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      results: results.map((result, index) => ({
        url: contentUrls[index].url,
        status: result.status,
        ...(result.status === 'fulfilled'
          ? { data: result.value }
          : { error: result.reason.message })
      }))
    });
  } catch (error) {
    console.error('Error in index check route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
