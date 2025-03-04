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
  user_email text;
begin
  -- Only proceed when status changes from 'pending' to 'completed'
  if NEW.status = 'completed' and 
    (OLD.status = 'pending' or OLD.status is null) then

    -- Get content and user information
    select 
      c.id as content_id,
      c.title,
      c.user_id,
      au.email
    into content_info
    from content c
    join auth.users au on au.id = c.user_id
    where c.id = NEW.id;

    -- Send notification
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
        'order_id', NEW.id,
        'keyword', NEW.keyword,
        'title', content_info.title
      )
    );
  end if;

  return NEW;
end;
$$;

-- Create trigger on content_orders table
create trigger notify_content_ready_trigger
  after update on content_orders
  for each row
  execute function notify_content_ready();