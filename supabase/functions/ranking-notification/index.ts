import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY')!;
const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY')!;

// Add test email addresses
const TEST_EMAILS = [
  'jaden@elysium-studios.co.uk',
  'mike@elysium-studios.co.uk',
  'jaden9516williams@gmail.com'
];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEMPLATE_ID = 6740736; // need to update this to the new template

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { type, email, old_rankings, current_rankings } = body;

    if (type !== 'ranking_change') {
      throw new Error('Invalid notification type');
    }

    const rankingChange = Number(current_rankings) - Number(old_rankings);
    const isPositive = rankingChange > 0;

    const emailResponse = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`)}`
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: 'noreply@espy-go.com',
              Name: 'Espy-Go Ranking Alerts'
            },
            To: TEST_EMAILS.map((email) => ({ Email: email })), // Send to test emails only
            TemplateID: TEMPLATE_ID,
            TemplateLanguage: true,
            Variables: {
              ranking_change: Math.abs(rankingChange),
              is_positive: isPositive,
              dashboard_url: 'https://app.espy-go.com/rankings',
              opportunities_url: 'https://app.espy-go.com/opportunities'
            }
          }
        ]
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email notification');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
