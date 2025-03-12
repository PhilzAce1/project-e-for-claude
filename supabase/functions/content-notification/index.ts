import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY')!;
const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY')!;

const TEMPLATE_ID = 6740736;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { type, email, last_content_date } = body;

    if (type !== 'inactivity_reminder') {
      throw new Error('Invalid notification type');
    }

    const lastContentDate = last_content_date
      ? new Date(last_content_date)
      : null;
    const daysInactive = lastContentDate
      ? Math.floor(
          (new Date().getTime() - lastContentDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

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
              Name: 'Content Notifications'
            },
            To: [
              {
                Email: email
              }
            ],
            TemplateID: TEMPLATE_ID,
            TemplateLanguage: true,
            Variables: {
              days_inactive: daysInactive || 'a while',
              content_url: 'https://app.espy-go.com/your-content'
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
