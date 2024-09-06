import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Function starting...")

Deno.serve(async (req) => {
  console.log("Request received")

  try {
    // Parse the request body
    const { domain, userId } = await req.json()
    console.log(`Initiating SEO crawl for domain: ${domain}, userId: ${userId}`)

    // Here, implement your SEO crawl logic
    // For example:
    // await performSEOCrawl(domain)

    // You can also update the database to indicate that the crawl has started
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Updating database...')
    const { data, error } = await supabaseClient
      .from('seo_crawls')
      .insert({ user_id: userId, domain: domain, status: 'initiated' })

    if (error) {
      console.error('Error updating database:', error)
      return new Response(JSON.stringify({ error: 'Failed to update database' }), { status: 500 })
    }

    console.log('Database updated successfully')
    return new Response(JSON.stringify({ message: 'SEO crawl initiated', data }), { status: 200 }))
  } catch (error) {
    console.error('Error in Edge Function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 }))
  }
})
