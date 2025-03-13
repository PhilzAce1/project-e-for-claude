import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

console.log('🚀 Function is starting...');

Deno.serve(async (req) => {
  console.log('📥 Request received:', req);

  try {
    if (req.method !== 'POST') {
      console.log('❌ Invalid method:', req.method);
      return new Response('Method Not Allowed', { status: 405 });
    }

    const bodyText = await req.text(); // Get raw text first
    const requestData = JSON.parse(bodyText); // Parse it manually
    console.log('📝 Parsed JSON data:', requestData.record.user_id);
    const { domain, user_Id } = requestData.record;

    const apiBaseUrl = Deno.env.get('API_BASE_URL');
    const authHeader = req.headers.get('Authorization');

    if (!apiBaseUrl) {
      console.error('API_BASE_URL environment variable is not set');
      throw new Error('API_BASE_URL environment variable is not set');
    }

    console.log(`Attempting to fetch from: ${apiBaseUrl}/api/site-map`);
    console.log('authHeader', authHeader);
    console.log('domain', domain);
    console.log('userId', requestData.record.user_id);

    try {
      const response = await fetch(`${apiBaseUrl}/api/site-map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader || '' // Forward the bearer token
        },
        body: JSON.stringify({
          domain,
          maxPages: 100,
          userId: requestData.record.user_id
        })
      });

      console.log('Fetch response status:', response);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('✅ API response:', apiResponse);

      return new Response(JSON.stringify(apiResponse), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (fetchError) {
      console.error('Fetch error details:', fetchError);
      throw new Error(`Error fetching site-map: ${fetchError.message}`);
    }
  } catch (error) {
    console.error('❌ Error in function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
