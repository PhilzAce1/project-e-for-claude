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
  user_info record;
begin
  -- Only proceed when status changes from 'pending' to 'completed'
  if NEW.status = 'completed' and 
    (OLD.status = 'pending' or OLD.status is null) then

    -- Get user information
    select 
      au.email
    into user_info
    from auth.users au
    where au.id = NEW.user_id;

    -- Debug log
    raise notice 'Sending notification for order_id: %, user_email: %', NEW.id, user_info.email;

    -- Send notification
    perform net.http_post(
      url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/content-ready-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
      ),
      body := jsonb_build_object(
        'type', 'content_ready',
        'user_id', NEW.user_id,
        'email', user_info.email,
        'order_id', NEW.id,
        'keyword', NEW.keyword
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