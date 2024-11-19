-- Add a completion_status column to business_analyses
alter table business_analyses add column if not exists completion_status jsonb default '{
  "verification": false,
  "critical": false,
  "recommended": false
}'::jsonb;