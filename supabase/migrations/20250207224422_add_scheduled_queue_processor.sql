-- Enable pg_cron extension first
create extension if not exists "pg_cron";

-- Create a function that processes the queue
create or replace function process_country_update_queue()
returns void
language plpgsql
security definer
as $$
declare
  queue_item record;
begin
  -- Get unprocessed items
  for queue_item in 
    select * from country_update_queue 
    where processed = false 
    order by created_at 
    limit 5  -- Process in small batches
  loop
    -- Call the edge function
    perform net.http_post(
    url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/on_country_update',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'user_id', queue_item.user_id,
          'domain', queue_item.domain,
          'target_country', queue_item.target_country
        )
      )
    );

    -- Mark as processed
    update country_update_queue 
    set processed = true 
    where id = queue_item.id;

  end loop;
end;
$$;

-- Create a scheduled job to run every minute
select cron.schedule(
  'process-country-updates',  -- name of the cron job
  '* * * * *',              -- every minute
  'select process_country_update_queue()'
); 