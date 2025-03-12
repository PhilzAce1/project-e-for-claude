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

const TEMPLATE_ID = 6774183;

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return formatter.format(date); // Will output: "06 Mar, 2024"
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { type, email, domain, current_score, previous_score, audit_date } =
      body;

    if (type !== 'site_audit_change') {
      throw new Error('Invalid notification type');
    }

    const isImproved = previous_score ? current_score > previous_score : true;
    const scoreDiff = previous_score
      ? Math.abs(current_score - previous_score).toFixed(1)
      : 'N/A';

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
              Name: 'Espy-Go Site Audit'
            },
            To: TEST_EMAILS.map((email) => ({ Email: email })),
            TemplateID: TEMPLATE_ID,
            TemplateLanguage: true,
            Variables: {
              domain: domain,
              current_score: current_score,
              previous_score: previous_score || 'N/A',
              score_difference: scoreDiff,
              is_improved: isImproved,
              audit_date: formatDate(audit_date),
              site_audit_url: `https://app.espy-go.com/site-audit/${domain}`,
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
        message: 'Site audit notification sent successfully'
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
