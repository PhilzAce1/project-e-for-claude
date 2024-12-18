// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record


  try {
    // Generate keywords
    console.log('Generating keywords for user', record.user_id, Deno.env.get('API_BASE_URL'))
    const response = await fetch(`${Deno.env.get('API_BASE_URL')}/api/suggest-keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        userId: record.user_id
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate keywords' + JSON.stringify(response))
    }

    // Update business_analysis status
    await supabase
      .from('business_analysis')
      .update({ 
        status: 'keywords_generated',
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id)

    return new Response(
      JSON.stringify({ message: 'Keywords generated successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/suggestKeywords' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
