import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the payload from the webhook
    const payload = await req.json()
    const { record } = payload

    if (!record?.user_id || !record?.domain) {
      throw new Error('Missing required fields')
    }

    // Get all competitors for this user
    const { data: competitors, error: competitorsError } = await supabaseClient
      .from('competitors')
      .select('id, domain')
      .eq('user_id', record.user_id)

    if (competitorsError) throw competitorsError

    // Function to trigger rankings update
    const triggerRankingsUpdate = async (userId: string, domain: string, competitorId?: string) => {
      const response = await fetch(`${Deno.env.get('PUBLIC_BASE_URL')}/api/get-ranked-keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          domain,
          ...(competitorId && { competitor_id: competitorId }),
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update rankings for domain: ${domain}`)
      }

      return response.json()
    }

    // Update rankings for the main domain
    await triggerRankingsUpdate(record.user_id, record.domain)

    // Update rankings for all competitors
    if (competitors) {
      await Promise.all(
        competitors.map(competitor => 
          triggerRankingsUpdate(record.user_id, competitor.domain, competitor.id)
        )
      )
    }

    return new Response(
      JSON.stringify({ message: 'Rankings update triggered successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 