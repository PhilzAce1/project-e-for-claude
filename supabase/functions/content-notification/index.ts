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

    const emailContent = {
      subject: 'Create Your Next Content Piece',
      textPart: `It's been ${daysInactive ? `${daysInactive} days` : 'a while'} since your last content creation. Keep your momentum going!`,
      htmlPart: `
        <h3>Time to Create More Content!</h3>
        <p>We noticed it's been ${daysInactive ? `${daysInactive} days` : 'a while'} since your last content creation.</p>
        <p>Keep your momentum going by creating new content today!</p>
        <p>Regular content creation is key to improving your search rankings.</p>
        <p><a href="https://app.espy-go.com/your-content">Click here to create new content</a></p>
        <p><small>Original recipient: ${email}</small></p>
      `
    };

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
            To: TEST_EMAILS.map((email) => ({ Email: email })), // Send to test emails only
            Subject: emailContent.subject,
            TextPart: emailContent.textPart,
            HTMLPart: emailContent.htmlPart
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
