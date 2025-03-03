-- Drop existing cron jobs (safely)
do $$
begin
  perform cron.unschedule('notify-site-audit-changes');
exception
  when others then
    raise notice 'Cron job does not exist, skipping';
end $$;

-- Create function to notify users about site audit changes
create or replace function notify_site_audit_changes()
returns void
language plpgsql
security definer
as $$
declare
  audit_change record;
  previous_audit record;
  current_score numeric;
  previous_score numeric;
begin
  -- Get latest completed crawls with score changes
  for audit_change in 
    select 
      sc.id,
      sc.user_id,
      sc.domain,
      sc.onpage_score,
      sc.created_at,
      u.email
    from seo_crawls sc
    join auth.users u on u.id = sc.user_id
    where 
      -- Only consider completed crawls
      sc.crawl_status->>'status' = 'completed'
      -- Get the most recent crawl for each domain
      and sc.created_at = (
        select max(created_at)
        from seo_crawls
        where domain = sc.domain
        and crawl_status->>'status' = 'completed'
      )
  loop
    -- Get previous completed crawl for comparison
    select 
      onpage_score
    into previous_audit
    from seo_crawls
    where domain = audit_change.domain
      and crawl_status->>'status' = 'completed'
      and created_at < audit_change.created_at
    order by created_at desc
    limit 1;

    -- Convert scores to numeric for comparison
    current_score := audit_change.onpage_score::numeric;
    previous_score := previous_audit.onpage_score::numeric;

    -- Only notify if there's a score change
    if previous_score is null or current_score != previous_score then
      -- Send notification
      perform net.http_post(
        url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/site-audit-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
        ),
        body := jsonb_build_object(
          'type', 'site_audit_change',
          'user_id', audit_change.user_id,
          'email', audit_change.email,
          'domain', audit_change.domain,
          'current_score', current_score,
          'previous_score', previous_score,
          'audit_date', audit_change.created_at
        )
      );
    end if;

  end loop;
end;
$$;

-- Schedule the cron job (daily at 12 PM)
select cron.schedule(
  'notify-site-audit-changes',
  '0 12 * * *',
  'select notify_site_audit_changes()'
);