-- Drop existing triggers (safely)
do $$
begin
  drop trigger if exists notify_content_ready_trigger on content_orders;
exception
  when others then
    raise notice 'Trigger does not exist, skipping';
end $$;

-- Create notification function
create or replace function notify_content_ready()
returns trigger
language plpgsql
security definer
as $$
declare
  content_info record;
begin
  -- Debug log
  raise notice 'Function triggered with NEW status: %, OLD status: %', NEW.status, OLD.status;

  -- Only proceed when status changes to 'completed'
  if NEW.status = 'completed' and 
    (OLD.status = 'pending' or OLD.status is null) then

    -- Get content and user information with explicit joins
    select 
      c.id as content_id,
      c.title,
      c.user_id,
      au.email,
      NEW.keyword,
      NEW.id as order_id
    into content_info
    from content_orders co
    join content c on c.id = co.id
    join auth.users au on au.id = co.user_id
    where co.id = NEW.id;

    -- Debug log
    raise notice 'Retrieved content_info: %', content_info;

    -- Validate data before sending
    if content_info.email is null then
      raise warning 'Email is null for order_id: %. Aborting notification.', NEW.id;
      return NEW;
    end if;

    -- Debug log before sending
    raise notice 'Sending notification with data: %', jsonb_build_object(
      'type', 'content_ready',
      'user_id', content_info.user_id,
      'email', content_info.email,
      'content_id', content_info.content_id,
      'order_id', content_info.order_id,
      'keyword', coalesce(NEW.keyword, ''),
      'title', coalesce(content_info.title, '')
    );

    -- Send notification with verified data
    perform net.http_post(
      url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/content-ready-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
      ),
      body := jsonb_build_object(
        'type', 'content_ready',
        'user_id', content_info.user_id,
        'email', content_info.email,
        'content_id', content_info.content_id,
        'order_id', content_info.order_id,
        'keyword', coalesce(NEW.keyword, ''),
        'title', coalesce(content_info.title, '')
      )
    );
  end if;

  return NEW;
end;
$$;

-- Recreate trigger
drop trigger if exists notify_content_ready_trigger on content_orders;
create trigger notify_content_ready_trigger
  after update on content_orders
  for each row
  execute function notify_content_ready();