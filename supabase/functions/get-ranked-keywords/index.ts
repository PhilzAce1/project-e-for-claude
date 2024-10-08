import { createClient } from "npm:@supabase/supabase-js"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live'

serve(async (req) => {
  const { user_id, target } = await req.json()

  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Fetch data from DataForSEO API
    const dataForSEOResponse = await fetch(DATAFORSEO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(Deno.env.get('DATAFORSEO_LOGIN') + ':' + Deno.env.get('DATAFORSEO_PASSWORD'))
      },
      body: JSON.stringify([
        {
          "target": target,
          "location_code": 2826, // Example: UK
          "language_code": "en",
          "historical_serp_mode":"live", 
          "ignore_synonyms":false, 
          "include_clickstream_data":false, 
          "item_types":["organic", "paid"], 
          "load_rank_absolute":false, 
          "limit":1000
        }
      ])
    })

    if (!dataForSEOResponse.ok) {
      throw new Error('Failed to fetch data from DataForSEO')
    }

    const dataForSEOData = await dataForSEOResponse.json()

    // Process the data (example - adjust according to your needs)
    const processedData = {
      total_count: dataForSEOData.tasks[0].result[0].total_count,
      items: dataForSEOData.tasks[0].result[0].items,
      // Add more fields as needed
    }

    // Save to Supabase
    const { error } = await supabase
      .from('business_information')
      .insert({
        user_id: user_id,
        rankings_data: processedData,
        crawl_date: new Date().toISOString(),
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data: processedData }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})