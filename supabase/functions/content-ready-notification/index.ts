import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY')!;
const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY')!;

const TEMPLATE_ID = 6777865;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log('Received notification request:', body);

    const { type, email, order_id, keyword } = body;

    // Validate required fields
    if (!type || type !== 'content_ready') {
      throw new Error('Invalid notification type');
    }

    // Ensure we have values for template variables
    const templateVars = {
      keyword: keyword || 'Not specified',
      orders_url: `https://app.espy-go.com/orders/${order_id || ''}`
    };

    console.log('Sending email with variables:', templateVars);

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
            To: [
              {
                Email: email
              }
            ],
            TemplateID: TEMPLATE_ID,
            TemplateLanguage: true,
            Variables: templateVars
          }
        ]
      })
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Mailjet API Error:', emailData);
      throw new Error(
        `Failed to send email notification: ${JSON.stringify(emailData.Messages[0]?.Errors || emailData)}`
      );
    }

    console.log('Email sent successfully:', emailData);

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
    console.error('Error in notification function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
