// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DATAFORSEO_API_URL = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
const DATAFORSEO_LOGIN = Deno.env.get('DATAFORSEO_LOGIN')
const DATAFORSEO_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req: Request) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const { user } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Get keyword from request body
    const { keyword, locationCode = 2826, languageCode = "en" } = await req.json()

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'Keyword is required' }),
        { status: 400 }
      )
    }

    // Call DataForSEO API
    const response = await fetch(DATAFORSEO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        language_code: languageCode,
        location_code: locationCode,
        keyword: keyword,
        calculate_rectangles: true,
        depth: 100 // Get top 100 results
      }])
    })

    const data = await response.json()

    if (data.status_code !== 20000) {
      throw new Error(`DataForSEO API error: ${data.status_message}`)
    }

    // Process and store the results
    const result = data.tasks?.[0]?.result?.[0]
    
    if (!result) {
      throw new Error('No results found')
    }

    // Store in Supabase
    const { error: dbError } = await supabase
      .rpc('analyze_serp_data', {
        user_id_param: user.id,
        serp_data: result
      })

    if (dbError) {
      throw dbError
    }

    // Return processed results
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          keyword: result.keyword,
          total_results: result.se_results_count,
          serp_features: result.item_types,
          organic_results: result.items
            .filter(item => item.type === 'organic')
            .map(item => ({
              title: item.title,
              url: item.url,
              description: item.description,
              position: item.rank_group
            })),
          people_also_ask: result.items
            .filter(item => item.type === 'people_also_ask')?.[0]?.items || [],
          related_searches: result.items
            .filter(item => item.type === 'related_searches')?.[0]?.items || []
        }
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-serp_result' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
