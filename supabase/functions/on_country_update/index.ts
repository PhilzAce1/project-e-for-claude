import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Function triggered with request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response('ok', { headers: corsHeaders });
    }

    // Log environment variables (excluding sensitive values)
    console.log('Environment check:', {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasPublicBaseUrl: !!Deno.env.get('PUBLIC_BASE_URL'),
    });

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Supabase client created');

    // Get the payload from the webhook
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    const { record } = payload;
    console.log('Processing record:', JSON.stringify(record, null, 2));

    if (!record?.user_id || !record?.domain) {
      console.error('Missing required fields:', { record });
      throw new Error('Missing required fields: user_id or domain');
    }

    // Get all competitors for this user
    console.log('Fetching competitors for user:', record.user_id);
    const { data: competitors, error: competitorsError } = await supabaseClient
      .from('competitors')
      .select('id, domain')
      .eq('user_id', record.user_id);

    if (competitorsError) {
      console.error('Error fetching competitors:', competitorsError);
      throw competitorsError;
    }
    console.log('Found competitors:', competitors?.length || 0);

    // Function to trigger rankings update
    const triggerRankingsUpdate = async (userId: string, domain: string, competitorId?: string) => {
      console.log('Triggering rankings update for:', { userId, domain, competitorId });
      const url = `${Deno.env.get('API_BASE_URL')}/api/get-ranked-keywords`;
      console.log('Making request to:', url);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            domain,
            ...(competitorId && { competitor_id: competitorId }),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Rankings update failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to update rankings for domain: ${domain}. Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Rankings update successful:', result);
        return result;
      } catch (error) {
        console.error('Error in triggerRankingsUpdate:', error);
        throw error;
      }
    };

    // Update rankings for the main domain
    console.log('Updating main domain rankings');
    await triggerRankingsUpdate(record.user_id, record.domain);

    // Update rankings for all competitors
    if (competitors?.length) {
      console.log('Starting competitor rankings updates');
      await Promise.all(
        competitors.map(async competitor => {
          try {
            await triggerRankingsUpdate(record.user_id, competitor.domain, competitor.id);
          } catch (error) {
            console.error(`Failed to update competitor ${competitor.domain}:`, error);
            // Continue with other competitors even if one fails
            return null;
          }
        })
      );
      console.log('Completed all competitor updates');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Rankings update triggered successfully',
        processedCompetitors: competitors?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 