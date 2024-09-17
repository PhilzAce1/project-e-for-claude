import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Mailjet API credentials (should be stored securely, e.g., as environment variables)
const MAILJET_API_KEY = Deno.env.get("MAILJET_API_KEY");
const MAILJET_SECRET_KEY = Deno.env.get("MAILJET_SECRET_KEY");
const LIST_ID = 10456699;

console.log("Add to Mailjet function initialized");

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    if (payload.type !== 'UPDATE') {
      throw new Error("This function only handles UPDATE events");
    }

    const { record } = payload;
    if (!record.email) {
      throw new Error("Email is required");
    }

    // Check if the user is an SSO user or has a confirmation token
    if (!record.confirmed_at) {
      return new Response(JSON.stringify({ message: "Skipped Mailjet update" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // First, create or update the contact
    const contactUrl = "https://api.mailjet.com/v3/REST/contact";
    const contactBody = JSON.stringify({
      Email: record.email,
      Name: record.raw_user_meta_data?.name || '',
    });

    const contactResponse = await fetch(contactUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`)}`,
      },
      body: contactBody,
    });

    if (!contactResponse.ok) {
      throw new Error(`Mailjet API error (contact): ${contactResponse.statusText}`);
    }
    console.log("User addres", contactResponse);

    // Then, add the contact to the specified list
    const listUrl = `https://api.mailjet.com/v3/REST/listrecipient`;
    const listBody = JSON.stringify({
      ListID: LIST_ID,
      ContactALT: record.email,
    });

    const listResponse = await fetch(listUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`)}`,
      },
      body: listBody,
    });

    if (!listResponse.ok) {
      throw new Error(`Mailjet API error (list): ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    return new Response(JSON.stringify(listData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/add-to-mailjet' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
