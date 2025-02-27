-- Drop existing cron job (safely)
do $$
begin
  perform cron.unschedule('notify-ranking-changes');
exception
  when others then
    raise notice 'Cron job does not exist, skipping';
end $$;

-- Drop existing trigger and function (safely)
do $$
begin
  -- Drop trigger if exists
  if exists (
    select 1
    from pg_trigger
    where tgname = 'before_rankings_update'
  ) then
    drop trigger if exists before_rankings_update on business_information;
  end if;
  
  -- Drop functions if they exist
  drop function if exists notify_ranking_changes();
  drop function if exists store_previous_rankings();
exception
  when others then
    raise notice 'Error dropping existing objects: %', SQLERRM;
end $$;

-- Create function to notify ranking changes
create or replace function notify_ranking_changes()
returns void
language plpgsql
security definer
as $$
declare
  business record;
  ranking_changes jsonb;
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

    -- Extract ranking changes from metrics.organic
    select jsonb_build_object(
      'is_up', coalesce((business.rankings_data -> 'metrics' -> 'organic' -> 'is_up')::text::integer, 0),
      'is_down', coalesce((business.rankings_data -> 'metrics' -> 'organic' -> 'is_down')::text::integer, 0),
      'is_new', coalesce((business.rankings_data -> 'metrics' -> 'organic' -> 'is_new')::text::integer, 0),
      'is_lost', coalesce((business.rankings_data -> 'metrics' -> 'organic' -> 'is_lost')::text::integer, 0)
    ) into ranking_changes;

    -- Only notify if there are any changes
    if (
      (ranking_changes ->> 'is_up')::int > 0 or
      (ranking_changes ->> 'is_down')::int > 0 or
      (ranking_changes ->> 'is_new')::int > 0 or
      (ranking_changes ->> 'is_lost')::int > 0
    ) then
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
          'ranking_changes', ranking_changes,
          'updated_at', business.rankings_updated_at
        )
      );
    end if;
  end loop;
end;
$$;

-- Add column for previous rankings if not exists
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'business_information'
    and column_name = 'previous_rankings_data'
  ) then
    alter table business_information 
    add column previous_rankings_data jsonb;
  end if;
end $$;

-- Create trigger function to store previous rankings
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

-- Create trigger if it doesn't exist
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'before_rankings_update'
  ) then
    create trigger before_rankings_update
      before update on business_information
      for each row
      execute function store_previous_rankings();
  end if;
end $$;

-- Schedule the cron job
select cron.schedule(
  'notify-ranking-changes',
  '0 9 * * *',    -- Every day at 9 AM
  'select notify_ranking_changes()'
); 