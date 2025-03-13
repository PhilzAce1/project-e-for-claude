import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('🚀 Starting Check and Index Content function...');

async function checkUrlIndexStatus(url: string, accessToken: string) {
  const endpoint =
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
  const siteUrl = new URL(url).origin + '/';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: siteUrl
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `URL Inspection API error: Status ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = `URL Inspection API error: ${JSON.stringify(errorJson)}`;
      } catch (parseError) {
        errorMessage = `URL Inspection API error: ${errorText.substring(0, 200)}...`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      url,
      isIndexed: data.inspectionResult?.indexStatusResult?.isIndexed ?? false,
      lastCrawlTime: data.inspectionResult?.indexStatusResult?.lastCrawlTime,
      rawResponse: data
    };
  } catch (error) {
    console.error('Error checking URL index status:', error);
    throw error;
  }
}

async function submitUrlForIndexing(url: string, accessToken: string) {
  const endpoint =
    'https://indexing.googleapis.com/v3/urlNotifications:publish';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Indexing API error: Status ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = `Indexing API error: ${JSON.stringify(errorJson)}`;
      } catch (parseError) {
        errorMessage = `Indexing API error: ${errorText.substring(0, 200)}...`;
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting URL for indexing:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  console.log('📥 Request received');

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const bodyText = await req.text();
    const requestData = JSON.parse(bodyText);

    const userId = requestData.user_id;
    const accessToken = requestData.access_token;

    if (!userId || !accessToken) {
      throw new Error('Missing required user_id or access_token');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: gscConnection, error: gscError } = await supabase
      .from('gsc_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (gscError || !gscConnection) {
      throw new Error('No Google Search Console connection found');
    }

    const verifiedSites = gscConnection.sites || [];

    if (verifiedSites.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No verified sites found in Search Console'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const { data: contentUrls, error: contentError } = await supabase
      .from('content')
      .select('*')
      .eq('user_id', userId)
      .eq('site_indexed', false);

    if (contentError) {
      throw new Error(`Error fetching content: ${contentError.message}`);
    }

    if (!contentUrls || contentUrls.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No unindexed content found' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const batchSize = 10;
    const results: Array<{
      url: string;
      status: string;
      reason?: string;
      result?: any;
      lastCrawlTime?: string;
      error?: string;
    }> = [];

    for (let i = 0; i < contentUrls.length; i += batchSize) {
      const batch = contentUrls.slice(i, i + batchSize);

      for (const { id, url } of batch) {
        try {
          const urlObj = new URL(url);
          const origin = urlObj.origin + '/';

          if (
            !verifiedSites.some(
              (site) => site === origin || site === origin.slice(0, -1)
            )
          ) {
            results.push({
              url,
              status: 'skipped',
              reason: 'URL not in verified sites'
            });
            continue;
          }

          const indexStatus = await checkUrlIndexStatus(url, accessToken);

          if (!indexStatus.isIndexed) {
            const indexResult = await submitUrlForIndexing(url, accessToken);

            await supabase
              .from('content')
              .update({
                site_indexed: true,
                last_modified: new Date().toISOString()
              })
              .eq('id', id);

            results.push({
              url,
              status: 'indexed',
              result: indexResult
            });
          } else {
            await supabase
              .from('content')
              .update({
                site_indexed: true,
                last_modified:
                  indexStatus.lastCrawlTime || new Date().toISOString()
              })
              .eq('id', id);

            results.push({
              url,
              status: 'already_indexed',
              lastCrawlTime: indexStatus.lastCrawlTime
            });
          }
        } catch (error) {
          results.push({
            url,
            status: 'failed',
            error: error.message
          });
        }
      }

      if (i + batchSize < contentUrls.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
