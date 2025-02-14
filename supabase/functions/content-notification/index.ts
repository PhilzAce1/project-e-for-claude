import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY')!;
const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const { data: notifications, error: fetchError } = await supabase
      .from('content_notifications')
      .select(
        `
        id,
        content_id,
        content:content (
          title,
          url,
          user_id
        )
      `
      )
      .eq('status', 'pending')
      .limit(50);

    if (fetchError) throw fetchError;

    for (const notification of notifications) {
      try {
        // Get user email
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('email')
          .eq('id', notification.content.user_id)
          .single();

        if (userError) throw userError;

        // Send email via Mailjet
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
                    Email: userData.email
                  }
                ],
                Subject: `Content Created: ${notification.content.title}`,
                TextPart: `Your content "${notification.content.title}" has been created.\nView it here: ${notification.content.url}`,
                HTMLPart: `
                <h3>Content Created Successfully!</h3>
                <p>Your content "${notification.content.title}" has been created.</p>
                <p><a href="${notification.content.url}">Click here to view your content</a></p>
              `
              }
            ]
          })
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to send email notification');
        }

        // Mark notification as processed
        await supabase
          .from('content_notifications')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', notification.id);
      } catch (error) {
        // Mark failed notification
        await supabase
          .from('content_notifications')
          .update({
            status: 'failed',
            error: error.message
          })
          .eq('id', notification.id);
      }
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
