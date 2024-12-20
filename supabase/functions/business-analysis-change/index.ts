// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Business Analysis Change Function Started!")

Deno.serve(async (req) => {
  try {
    const { old_record, new_record, user_id } = await req.json()
    
    // Log the records for debugging
    console.log('Old Record:', JSON.stringify(old_record, null, 2))
    console.log('New Record:', JSON.stringify(new_record, null, 2))

    // Check if domain was added/changed
    if (old_record.domain === null && new_record.domain) {
      console.log(`Domain changed from null to ${new_record.domain}`)

      // Call your API endpoint
      const response = await fetch(`${Deno.env.get('BASE_URL')}/api/business-information-extraction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: new_record.domain,
          analysisId: new_record.id,
          userId: user_id
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`)
      }

      console.log('API call successful')
      const data = await response.json()
      console.log('API Response:', JSON.stringify(data, null, 2))
    } else {
      console.log('No domain change detected or domain not added')
      console.log(`Old domain: ${old_record.domain}, New domain: ${new_record.domain}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } },
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/business-analysis-change' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"old_record": {"domain": null}, "new_record": {"domain": "example.com", "id": "123"}, "user_id": "456"}'

*/