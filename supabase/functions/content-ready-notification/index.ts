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

const TEMPLATE_ID = 6777865;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { type, email, order_id, keyword, title } = body;

    if (type !== 'content_ready') {
      throw new Error('Invalid notification type');
    }

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
              Name: 'Espy-Go Content Team'
            },
            To: TEST_EMAILS.map((email) => ({ Email: email })),
            TemplateID: TEMPLATE_ID,
            TemplateLanguage: true,
            Variables: {
              keyword: keyword,
              title: title,
              orders_url: `https://app.espy-go.com/orders/${order_id}`,
              email: email
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
        message: 'Content ready notification sent successfully'
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
