import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import generateRankingsSummary from '@/utils/helpers/ranking-summary'
import { Rankings } from '@/utils/helpers/ranking-data-types'

const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateCompetitorMetrics(user_id: string) {
  try {
    // Fetch all competitors for this user
    const { data: competitors, error: fetchError } = await serviceRoleClient
      .from('competitors')
      .select('items')
      .eq('user_id', user_id)
      .not('items', 'is', null);

    if (fetchError) throw fetchError;

    // Calculate metrics
    const summaries = competitors.map(comp => generateRankingsSummary(comp as Rankings));
    const totalKeywords = summaries.reduce((sum, summary) => sum + summary.totalKeywords, 0);
    const averageKeywords = Math.round(totalKeywords / summaries.length);
    const totalOpportunities = summaries.reduce((sum, summary) => sum + summary.potentialOpportunities.length, 0);

    console.log('totalKeywords', totalKeywords);
    console.log('averageKeywords', averageKeywords);
    console.log('totalOpportunities', totalOpportunities);
    console.log('competitors', competitors.length);  
    console.log('last_updated', new Date().toISOString());


    // Save metrics to business_information
    const { error: updateError, data: updateData } = await serviceRoleClient
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

    console.log('updateData', updateData);

  } catch (error) {
    console.error('Error updating competitor metrics:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id or domain' }, { status: 400 })
    }
    await updateCompetitorMetrics(user_id);

    return NextResponse.json({ success: true, message: 'Competitor rankings data updated successfully' })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
