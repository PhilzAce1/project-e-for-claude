-- Drop existing cron job (safely)
do $$
begin
  perform cron.unschedule('notify-ranking-changes');
exception
  when others then
    raise notice 'Cron job does not exist, skipping';
end $$;

-- Create function to notify ranking changes
create or replace function notify_ranking_changes()
returns void
language plpgsql
security definer
as $$
declare
  business record;
  old_rankings jsonb;
  current_rankings jsonb;
begin
  -- Get businesses with rankings updated in the last day
  for business in 
    select 
      bi.user_id,
      bi.rankings_data,
      bi.rankings_updated_at,
      bi.previous_rankings_data,
      u.email
    from business_information bi
    join auth.users u on u.id = bi.user_id
    where bi.rankings_updated_at > now() - interval '1 day'
  loop
    -- Skip if no previous data to compare
    if business.previous_rankings_data is null then
      continue;
    end if;

    -- Compare rankings
    select 
      business.previous_rankings_data -> 'metrics' -> 'organic' -> 'pos_1' as old_top_rankings,
      business.rankings_data -> 'metrics' -> 'organic' -> 'pos_1' as current_top_rankings
    into old_rankings, current_rankings;

    -- Notify if there's a change
    if old_rankings != current_rankings then
      perform net.http_post(
        url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/ranking-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
        ),
        body := jsonb_build_object(
          'type', 'ranking_change',
          'user_id', business.user_id,
          'email', business.email,
          'old_rankings', old_rankings,
          'current_rankings', current_rankings,
          'updated_at', business.rankings_updated_at
        )
      );
    end if;
  end loop;
end;
$$;

-- Add column for previous rankings if not exists
alter table business_information 
add column if not exists previous_rankings_data jsonb;

-- Create trigger to store previous rankings
create or replace function store_previous_rankings()
returns trigger
language plpgsql
security definer
as $$
begin
  if OLD.rankings_data is distinct from NEW.rankings_data then
    NEW.previous_rankings_data = OLD.rankings_data;
  end if;
  return NEW;
end;
$$;

create trigger before_rankings_update
  before update on business_information
  for each row
  execute function store_previous_rankings();

-- Schedule the cron job
select cron.schedule(
  'notify-ranking-changes',
  '0 9 * * *',    -- Every day at 9 AM
  'select notify_ranking_changes()'
);