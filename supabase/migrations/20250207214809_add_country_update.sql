-- Create function to call edge function
create or replace function handle_country_update()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := '<SUPABASE_PROJECT_URL>/functions/v1/on_country_update',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || '<SUPABASE_SERVICE_ROLE_KEY>'
    ),
    body := jsonb_build_object(
      'record', row_to_json(new)
    )
  );
  return new;
end;
$$;

-- Create trigger
drop trigger if exists on_country_update on business_information;
create trigger on_country_update
  after update of target_country
  on business_information
  for each row
  when (old.target_country is distinct from new.target_country)
  execute function handle_country_update(); 