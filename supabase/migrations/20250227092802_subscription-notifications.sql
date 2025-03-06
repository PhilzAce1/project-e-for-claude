-- Drop existing cron job (safely)
do $$
begin
  perform cron.unschedule('notify-subscription-status');
exception
  when others then
    raise notice 'Cron job does not exist, skipping';
end $$;

-- Create function to notify subscription status
create or replace function notify_subscription_status()
returns void
language plpgsql
security definer
as $$
declare
  subscription record;
  days_remaining integer;
  content_remaining integer;
begin
  -- Get active subscriptions with remaining content and approaching end date
  for subscription in 
    select 
      s.id as subscription_id,
      s.user_id,
      s.current_period_end,
      s.quantity as total_content_allowed,
      u.email,
      (
        select count(*)
        from content c
        where c.user_id = s.user_id
        and c.created_at >= s.current_period_start
        and c.created_at <= s.current_period_end
      ) as content_created
    from subscriptions s
    join auth.users u on u.id = s.user_id
    where s.status = 'active'
    and s.cancel_at_period_end = false
    and s.current_period_end > now()
    and s.current_period_end <= now() + interval '14 days'
  loop
    -- Calculate days remaining
    days_remaining := extract(day from (subscription.current_period_end - now()));
    
    -- Calculate remaining content
    content_remaining := subscription.total_content_allowed - subscription.content_created;
    
    -- Only notify if there's content remaining
    if content_remaining > 0 then
      perform net.http_post(
        url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/subscription-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
        ),
        body := jsonb_build_object(
          'type', 'subscription_reminder',
          'user_id', subscription.user_id,
          'email', subscription.email,
          'days_remaining', days_remaining,
          'content_remaining', content_remaining,
          'subscription_id', subscription.subscription_id
        )
      );
    end if;
  end loop;
end;
$$;

-- Schedule the cron job to run daily at 9 AM
select cron.schedule(
  'notify-subscription-status',
  '0 9 * * *',    -- Every day at 9 AM
  'select notify_subscription_status()'
);