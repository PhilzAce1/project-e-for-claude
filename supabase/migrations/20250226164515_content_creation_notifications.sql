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
  -- Get users who need notifications
  for inactive_user in 
    select distinct on (u.id)
      u.id as user_id,
      u.email,
      c.id as content_id,
      c.created_at as last_content_date,
      c.last_inactivity_notification
    from auth.users u
    left join lateral (
      select id, created_at, last_inactivity_notification
      from content
      where user_id = u.id
      order by created_at desc
      limit 1
    ) c on true
    where 
      -- Either no content or content older than a week
      (c.created_at is null or c.created_at < now() - interval '1 week')
      -- And either no notification or notification older than 7 days
      and (c.last_inactivity_notification is null or c.last_inactivity_notification < now() - interval '7 days')
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

    -- If user has existing content, update the timestamp on their most recent content
    if inactive_user.content_id is not null then
      update content 
      set last_inactivity_notification = now()
      where id = inactive_user.content_id;
    else
      -- If user has no content, create a record to track notifications
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