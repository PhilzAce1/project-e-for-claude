-- First add the completion_status column if it doesn't exist
alter table business_analyses add column if not exists completion_status jsonb default '{
  "verification": false,
  "critical": false,
  "recommended": false
}'::jsonb;

-- Create or replace the function
create or replace function update_analysis_section(
  p_analysis_id uuid,
  p_section text,
  p_answers jsonb
) returns void as $$
begin
  -- Insert/update answers
  insert into business_analysis_answers (
    analysis_id,
    category,
    field_name,
    section,
    answer,
    confidence
  )
  select 
    p_analysis_id,
    (answer->>'category')::business_category,
    answer->>'field_name',
    answer->>'section',
    answer->'answer',
    (answer->>'confidence')::float
  from jsonb_array_elements(p_answers) as answer
  on conflict (analysis_id, field_name) do update
  set 
    answer = excluded.answer,
    confidence = excluded.confidence,
    updated_at = now();

  -- Update completion status
  update business_analyses
  set completion_status = jsonb_set(
    coalesce(completion_status, '{}'::jsonb),
    array[p_section],
    'true'
  )
  where id = p_analysis_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function update_analysis_section to authenticated;
