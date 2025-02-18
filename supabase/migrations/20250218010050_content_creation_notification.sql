-- Drop existing objects
drop trigger if exists on_content_created on public.content;
drop function if exists handle_new_content_notification();
drop function if exists process_content_notifications();
drop function if exists notify_inactive_users();

-- Drop existing cron jobs (safely)
do $$
begin
  perform cron.unschedule('notify-inactive-users');
exception
  when others then
    raise notice 'Cron job notify-inactive-users does not exist, skipping';
end $$;

-- Enable required extensions
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

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
    having max(c.created_at) < now() - interval '1 week'
       or max(c.created_at) is null
  loop
    perform net.http_post(
      url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/content-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'inactivity_reminder',
        'user_id', inactive_user.user_id,
        'email', inactive_user.email,
        'last_content_date', inactive_user.last_content_date
      )
    );
  end loop;
end;
$$;

-- Schedule the cron job
select cron.schedule(
  'notify-inactive-users',
  '0 9 * * 1',    -- Every Monday at 9 AM
  'select notify_inactive_users()'
);