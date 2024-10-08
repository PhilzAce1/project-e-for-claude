import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live'

export async function POST(req: Request) {
  try {
    const { user_id, domain } = await req.json()

    if (!user_id || !domain) {
      return NextResponse.json({ error: 'Missing user_id or domain' }, { status: 400 })
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '')

    // Fetch data from DataForSEO API
    const dataForSEOResponse = await fetch(DATAFORSEO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(process.env.DATAFORSEO_LOGIN + ':' + process.env.DATAFORSEO_PASSWORD)
      },
      body: JSON.stringify([
        {
          "target": cleanDomain,
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
      metrics: dataForSEOData.tasks[0].result[0].metrics,
    }

    console.log('get-ranked-keywords' ,processedData, user_id)
    // Update the business_information table
    const { error } = await serviceRoleClient
      .from('business_information')
      .update({
        rankings_data: processedData,
        rankings_updated_at: new Date().toISOString(),
      })
      .match({ user_id: user_id })

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Rankings data updated successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}