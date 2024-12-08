-- Create the function that will be called by the trigger
create function public.handle_business_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (NEW.completion_status->>'critical')::boolean = true 
     and (NEW.completion_status->>'recommended')::boolean = true 
     and (NEW.completion_status->>'verification')::boolean = true 
     and (
       (OLD.completion_status->>'critical')::boolean = false 
       or (OLD.completion_status->>'recommended')::boolean = false 
       or (OLD.completion_status->>'verification')::boolean = false
     ) then
    
    -- Call the edge function
    perform net.http_post(
      url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/suggestKeywords',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWtsbXBwd3VsaWlkbXZ6d3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTIyNTMzNSwiZXhwIjoyMDQwODAxMzM1fQ.vJuoCasJnJDE8A1AP0Vt6x68bCKIjXpoWYNTymlM6S0' -- Your service role key here
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  end if;
  return NEW;
end;
$$;

-- Create the triggerFrmPMTOUto7w4PfQ
create trigger on_business_completion
  after update on business_analyses
  for each row
  execute function handle_business_completion();
