import { createClient } from "npm:@supabase/supabase-js"
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const apiBaseUrl = Deno.env.get('API_BASE_URL')! // Make sure to set this environment variable

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

console.log("Cron job started")

Deno.serve(async (req) => {
  try {
    // Search for rows where rankings_data is null
    const { data, error } = await supabase
      .from('business_information')
      .select('id, user_id, domain')
      .is('rankings_data', null)

    if (error) {
      throw error
    }

    if (data && data.length > 0) {
      console.log(`Found ${data.length} rows with null rankings_data`)
      
      const processedRows = []
      
      // Process each row
      for (const row of data) {
        console.log(`Processing domain: ${row.domain} for user: ${row.user_id}`)
        
        try {
          // Call the get-ranked-keywords API endpoint
          const response = await fetch(`${apiBaseUrl}/api/get-ranked-keywords`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: row.user_id,
              domain: row.domain,
            }),
          })

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
          }

          const result = await response.json()
          console.log(`Successfully processed domain: ${row.domain}`)
          processedRows.push(row)
        } catch (error) {
          console.error(`Error processing domain ${row.domain}:`, error)
        }
      }

      return new Response(JSON.stringify({ 
        message: `Processed ${processedRows.length} out of ${data.length} rows with null rankings_data`,
        processed_rows: processedRows 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    } else {
      console.log("No rows found with null rankings_data")
      return new Response(JSON.stringify({ 
        message: "No rows found with null rankings_data" 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})

// Helper functions (to be implemented)
// async function fetchRankingsData(domain: string) {
//   // Implement the logic to fetch rankings data for a domain
// }

// async function updateRankingsData(rowId: number, rankingsData: any) {
//   // Implement the logic to update the rankings_data for a specific row
// }
