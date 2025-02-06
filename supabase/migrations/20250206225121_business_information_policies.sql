
-- Drop existing policies if they exist
drop policy if exists "Users can view their own business information" on business_information;
drop policy if exists "Users can update their own business information" on business_information;
drop policy if exists "Users can insert their own business information" on business_information;

-- Enable RLS
alter table business_information enable row level security;

-- Policy for viewing own business information
create policy "Users can view their own business information"
on business_information for select
using (auth.uid() = user_id);

-- Policy for inserting own business information
create policy "Users can insert their own business information"
on business_information for insert
with check (auth.uid() = user_id);

-- Policy for updating own business information
create policy "Users can update their own business information"
on business_information for update
using (auth.uid() = user_id);

-- Grant service role full access if needed
create policy "Service role has full access to business information"
on business_information
to service_role
using (true)
with check (true); 