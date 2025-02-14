-- Drop existing objects if they exist
drop trigger if exists on_content_created on public.content;
drop function if exists handle_new_content_notification();
drop function if exists process_content_notifications();
drop table if exists content_notifications;

-- Drop existing cron job if exists
select cron.unschedule('process-content-notifications');

-- Enable required extensions
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- Create content_notifications table
create table if not exists public.content_notifications (
    id uuid not null default gen_random_uuid(),
    content_id uuid not null references public.content(id) on delete cascade,
    status text not null default 'pending',
    created_at timestamp with time zone default now(),
    processed_at timestamp with time zone,
    error text,
    constraint content_notifications_pkey primary key (id)
);

-- Enable RLS
alter table public.content_notifications enable row level security;

-- Create policies
create policy "Users can view own notifications"
    on public.content_notifications
    for select
    using (
        auth.uid() = (
            select user_id 
            from public.content 
            where id = content_id
        )
    );

-- Create indexes
create index content_notifications_content_id_idx 
    on public.content_notifications(content_id);
create index content_notifications_status_idx 
    on public.content_notifications(status);

-- Create the notification handler function
create or replace function handle_new_content_notification()
returns trigger as $$
begin
    insert into content_notifications (
        content_id,
        status
    ) values (
        NEW.id,
        'pending'
    );
    return NEW;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_content_created
    after insert on public.content
    for each row
    execute function handle_new_content_notification();

-- Create the processing function
create or replace function process_content_notifications()
returns void
language plpgsql
security definer
as $$
declare
  notification_item record;
begin
  for notification_item in 
    select cn.*, c.url, c.title
    from content_notifications cn
    join content c on cn.content_id = c.id 
    where cn.status = 'pending' 
    order by cn.created_at 
    limit 10
  loop
    perform net.http_post(
      url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/content-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0'
      ),
      body := jsonb_build_object(
        'notification_id', notification_item.id,
        'content_id', notification_item.content_id,
        'url', notification_item.url,
        'title', notification_item.title
      )
    );

    update content_notifications 
    set 
      status = 'processed',
      processed_at = now()
    where id = notification_item.id;
  end loop;
end;
$$;

-- Schedule the cron job
select cron.schedule(
  'process-content-notifications',
  '*/15 * * * *',
  'select process_content_notifications()'
);