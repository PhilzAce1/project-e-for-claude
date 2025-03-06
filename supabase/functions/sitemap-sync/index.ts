import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiBaseUrl = Deno.env.get('API_BASE_URL');
    const authHeader = req.headers.get('Authorization');
    // Check if apiBaseUrl is defined
    if (!apiBaseUrl) {
      console.error("API_BASE_URL environment variable is not set");
      throw new Error("API_BASE_URL environment variable is not set");
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with content that needs syncing
    const { data: contentToSync, error: fetchError } = await supabaseClient
      .from('content')
      .select('user_id, url')
      .eq('sitemap_discovered', true)
      .or('sync_status.eq.pending,sync_status.eq.synced')
      .order('last_sync', { ascending: true })
      .limit(100); // Process in batches

    if (fetchError) {
      throw fetchError;
    }

    // Group content by user and domain
    const userDomains = new Map<string, Set<string>>();
    contentToSync?.forEach(content => {
      try {
        const domain = new URL(content.url).hostname;
        if (!userDomains.has(content.user_id)) {
          userDomains.set(content.user_id, new Set());
        }
        userDomains.get(content.user_id)?.add(domain);
      } catch (error) {
        console.error(`Invalid URL: ${content.url}`);
      }
    });

    // Process each user's domains
    const results = [];
    for (const [userId, domains] of userDomains.entries()) {
      for (const domain of domains) {
        try {
          // Call your sitemap sync API endpoint
          const response = await fetch(`${apiBaseUrl}/api/sitemap-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader || ""
            },
            body: JSON.stringify({
              domain,
              userId
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to sync domain ${domain}`);
          }
          const result = await response.json();
          results.push({
            userId,
            domain,
            added: result.added || 0,
            updated: result.updated || 0,
            removed: result.removed || 0,
            errors: result.errors || []
          });
        } catch (error) {
          results.push({
            userId,
            domain,
            error: `Failed to sync: ${error}`
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Sitemap sync completed', results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
