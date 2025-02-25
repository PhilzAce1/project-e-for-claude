-- Add column for last notification date
alter table content 
add column if not exists last_inactivity_notification timestamp with time zone;

-- Drop existing cron jobs (safely)
do $$
begin
  perform cron.unschedule('notify-inactive-users');
exception
  when others then
    raise notice 'Cron job does not exist, skipping';
end $$;

-- Create function to notify inactive users
create or replace function notify_inactive_users()
returns void
language plpgsql
security definer
as $$
declare
  inactive_user record;
begin
  for inactive_user in 
    select 
      u.id as user_id,
      u.email,
      max(c.created_at) as last_content_date
    from auth.users u
    left join content c on u.id = c.user_id
    group by u.id, u.email
    having (
      -- User hasn't created content in over a week
      (max(c.created_at) < now() - interval '1 week' or max(c.created_at) is null)
      and
      -- And either never received a notification or received it more than 7 days ago
      (max(c.last_inactivity_notification) is null or max(c.last_inactivity_notification) < now() - interval '7 days')
    )
  loop
    -- Send notification
    perform net.http_post(
      url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/content-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
      ),
      body := jsonb_build_object(
        'type', 'inactivity_reminder',
        'user_id', inactive_user.user_id,
        'email', inactive_user.email,
        'last_content_date', inactive_user.last_content_date
      )
    );

    -- Update the last notification timestamp on the most recent content
    update content 
    set last_inactivity_notification = now()
    where user_id = inactive_user.user_id
    and created_at = inactive_user.last_content_date;

    -- If user has no content, create a record to track notifications
    if inactive_user.last_content_date is null then
      insert into content (
        user_id,
        last_inactivity_notification,
        created_at
      ) values (
        inactive_user.user_id,
        now(),
        now()
      );
    end if;

  end loop;
end;
$$;

-- Schedule the cron job
select cron.schedule(
  'notify-inactive-users',
  '0 9 * * 1',    -- Every Monday at 9 AM
  'select notify_inactive_users()'
);