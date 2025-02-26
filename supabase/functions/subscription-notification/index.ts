import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY')!;
const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY')!;

// Test email addresses
const TEST_EMAILS = [
  'jaden@elysium-studios.co.uk',
  'mike@elysium-studios.co.uk',
  'jaden9516williams@gmail.com'
];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEMPLATE_ID = 6754222;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { type, email, days_remaining, content_remaining } = body;

    if (type !== 'subscription_reminder') {
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
              Name: 'Espy-Go Subscription'
            },
            To: TEST_EMAILS.map((email) => ({ Email: email })),
            TemplateID: TEMPLATE_ID,
            TemplateLanguage: true,
            Variables: {
              days_remaining,
              content_remaining,
              create_content_url: 'https://app.espy-go.com/create-content',
              subscription_url: 'https://app.espy-go.com/subscription',
              original_recipient: email
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
        message: 'Subscription notification sent successfully'
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
