import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import generateRankingsSummary from '@/utils/helpers/ranking-summary'
import { Rankings } from '@/utils/helpers/ranking-data-types'
import { getLocationCodeByCountry } from '@/utils/countries'
import Error from 'next/error'

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

async function updateCompetitorMetrics(business_id: string) {
  try {
    console.log('Starting updateCompetitorMetrics for business_id:', business_id);
    
    // Fetch all competitors for this business
    const { data: competitors, error: fetchError } = await serviceRoleClient
      .from('competitors')
      .select('items')
      .eq('business_id', business_id)
      .not('items', 'is', null);

    if (fetchError) {
      console.error('Error fetching competitors:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${competitors?.length || 0} competitors`);

    // Calculate metrics
    const summaries = competitors.map(comp => generateRankingsSummary(comp as Rankings));
    const totalKeywords = summaries.reduce((sum, summary) => sum + summary.totalKeywords, 0);
    const averageKeywords = Math.round(totalKeywords / summaries.length);
    const totalOpportunities = summaries.reduce((sum, summary) => sum + summary.potentialOpportunities.length, 0);

    console.log('Calculated metrics:', { totalKeywords, averageKeywords, totalOpportunities });

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
      .eq('id', business_id);

    if (updateError) {
      console.error('Error updating business_information:', updateError);
      throw updateError;
    }

    console.log('Successfully updated competitor metrics');

  } catch (error) {
    console.error('Error in updateCompetitorMetrics:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    console.log('Starting POST request');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { user_id, domain, competitor_id, business_id } = body;

    if (!user_id || !domain) {
      console.log('Missing required fields:', { user_id, domain });
      return NextResponse.json({ error: 'Missing user_id or domain' }, { status: 400 })
    }

    const cleanedDomain = cleanDomain(domain);
    console.log('Cleaned domain:', cleanedDomain);

    // Get the user's target country using service role client
    console.log('Fetching business info for business_id:', business_id);
    const { data: businessInfo, error: businessError } = await serviceRoleClient
      .from('business_information')
      .select('target_country')
      .eq('id', business_id)
      .single();

    if (businessError) {
      console.error('Error fetching business info:', businessError);
      throw businessError;
    }

    const locationCode = getLocationCodeByCountry(businessInfo?.target_country || 'GB');
    console.log('Using location code:', locationCode);

    // Fetch data from DataForSEO API
    console.log('Making DataForSEO request for domain:', cleanedDomain);
    const dataForSEOResponse = await fetch(DATAFORSEO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(process.env.DATAFORSEO_LOGIN + ':' + process.env.DATAFORSEO_PASSWORD)
      },
      body: JSON.stringify([
        {
          "target": cleanedDomain,
          "location_code": locationCode,
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
      console.error('DataForSEO response not ok:', await dataForSEOResponse.text());
      throw new Error('Failed to fetch data from DataForSEO')
    }

    const dataForSEOData = await dataForSEOResponse.json();
    console.log('DataForSEO response received');

    // Process the data
    const processedData = {
      total_count: dataForSEOData.tasks[0].result[0].total_count,
      items: dataForSEOData.tasks[0].result[0].items,
      metrics: dataForSEOData.tasks[0].result[0].metrics,
    }
    console.log('Processed data metrics:', { total_count: processedData.total_count });

    if (competitor_id) {
      console.log('Updating competitor:', competitor_id);
      // Update the competitors table
      const { error } = await serviceRoleClient
        .from('competitors')
        .update({
          items: processedData.items,
          metrics: processedData.metrics,
          total_count: processedData.total_count,
          rankings_updated_at: new Date().toISOString(),
        })
        .match({ id: competitor_id })

      if (error) {
        console.error('Error updating competitor:', error);
        throw error;
      }

      // Update competitor metrics
      await updateCompetitorMetrics(business_id);

      return NextResponse.json({ success: true, message: 'Competitor rankings data updated successfully' })
    } else {
      console.log('Updating business information:', business_id);
      // Update the business_information table
      const { error } = await serviceRoleClient
        .from('business_information')
        .update({
          rankings_data: processedData,
          rankings_updated_at: new Date().toISOString(),
        })
        .match({ id: business_id })

      if (error) {
        console.error('Error updating business information:', error);
        throw error;
      }

      return NextResponse.json({ success: true, message: 'Rankings data updated successfully' })
    }
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    // Log the full error object for debugging
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json({ error: 'Failed to process request', details: error.message }, { status: 500 })
  }
}
