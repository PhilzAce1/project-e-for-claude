import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY')!;
const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEMPLATE_ID = 6744408;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { type, email, ranking_changes } = body;

    if (type !== 'ranking_change') {
      throw new Error('Invalid notification type');
    }

    const { is_up, is_down, is_new, is_lost } = ranking_changes;

    // Calculate if overall trend is positive
    const isPositive =
      Number(is_up) + Number(is_new) >= Number(is_down) + Number(is_lost);

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
            To: [
              {
                Email: email
              }
            ],
            TemplateID: TEMPLATE_ID,
            TemplateLanguage: true,
            Variables: {
              is_positive: isPositive,
              keywords_up: Number(is_up),
              keywords_down: Number(is_down),
              keywords_new: Number(is_new),
              keywords_lost: Number(is_lost),
              dashboard_url: 'https://app.espy-go.com/rankings',
              opportunities_url: 'https://app.espy-go.com/opportunities'
            }
          }
        ]
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Mailjet API Error:', errorData);
      throw new Error('Failed to send email notification');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ranking change notification sent successfully'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
