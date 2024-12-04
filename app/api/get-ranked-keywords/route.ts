import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import generateRankingsSummary from '@/utils/helpers/ranking-summary'
import { Rankings } from '@/utils/helpers/ranking-data-types'

const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live'

function cleanDomain(domain: string): string {
  // Remove protocol (http:// or https://)
  let cleanedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');

  // Remove everything after the first slash (if present)
  cleanedDomain = cleanedDomain.split('/')[0];

  // Remove port number if present
  cleanedDomain = cleanedDomain.split(':')[0];

  return cleanedDomain;
}

async function updateCompetitorMetrics(user_id: string) {
  try {
    // Fetch all competitors for this user
    const { data: competitors, error: fetchError } = await serviceRoleClient
      .from('competitors')
      .select('rankings_data')
      .eq('user_id', user_id)
      .not('rankings_data', 'is', null);

    if (fetchError) throw fetchError;

    // Calculate metrics
    const summaries = competitors.map(comp => generateRankingsSummary(comp as Rankings));
    const totalKeywords = summaries.reduce((sum, summary) => sum + summary.totalKeywords, 0);
    const averageKeywords = Math.round(totalKeywords / summaries.length);
    const totalOpportunities = summaries.reduce((sum, summary) => sum + summary.potentialOpportunities.length, 0);

    // Save metrics to business_information
    const { error: updateError } = await serviceRoleClient
      .from('business_information')
      .update({
        competitor_metrics: {
          total_keywords: totalKeywords,
          average_keywords: averageKeywords,
          total_opportunities: totalOpportunities,
          competitor_count: competitors.length,
          last_updated: new Date().toISOString()
        }
      })
      .eq('user_id', user_id);

    if (updateError) throw updateError;

  } catch (error) {
    console.error('Error updating competitor metrics:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { user_id, domain, competitor_id } = await req.json()

    if (!user_id || !domain) {
      return NextResponse.json({ error: 'Missing user_id or domain' }, { status: 400 })
    }

    const cleanedDomain = cleanDomain(domain)

    // Fetch data from DataForSEO API
    const dataForSEOResponse = await fetch(DATAFORSEO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(process.env.DATAFORSEO_LOGIN + ':' + process.env.DATAFORSEO_PASSWORD)
      },
      body: JSON.stringify([
        {
          "target": cleanedDomain,
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

    if (competitor_id) {
      // Update the competitors table
      const { error } = await serviceRoleClient
        .from('competitors')
        .update({
          rankings_data: processedData,
          rankings_updated_at: new Date().toISOString(),
        })
        .match({ id: competitor_id })

      if (error) throw error

      // Update competitor metrics after adding/updating competitor data
      await updateCompetitorMetrics(user_id);

      return NextResponse.json({ success: true, message: 'Competitor rankings data updated successfully' })
    } else {
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
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
