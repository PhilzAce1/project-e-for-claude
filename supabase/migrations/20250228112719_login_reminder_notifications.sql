-- Drop existing cron jobs (safely)
do $$
begin
  perform cron.unschedule('notify-inactive-logins');
exception
  when others then
    raise notice 'Cron job does not exist, skipping';
end $$;

-- Create function to notify users who haven't logged in for a week
create or replace function notify_inactive_logins()
returns void
language plpgsql
security definer
as $$
declare
  inactive_user record;
begin
  -- Get users who haven't logged in for a week
  for inactive_user in 
    select 
      id,
      email,
      last_sign_in_at
    from auth.users
    where 
      -- User hasn't logged in for over a week
      last_sign_in_at < now() - interval '1 week'
      -- And has a valid email
      and email is not null
      -- And has logged in at least once (not a new unused account)
      and last_sign_in_at is not null
  loop
    -- Send notification
    perform net.http_post(
      url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/login-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
      ),
      body := jsonb_build_object(
        'type', 'login_reminder',
        'id', inactive_user.id,
        'email', inactive_user.email,
        'last_login_date', inactive_user.last_sign_in_at
      )
    );

  end loop;
end;
$$;

-- Schedule the cron job
select cron.schedule(
  'notify-inactive-logins',
  '0 9 * * 1',    -- Every Monday at 9 AM
  'select notify_inactive_logins()'
);