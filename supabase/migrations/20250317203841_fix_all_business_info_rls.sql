-- Drop all existing policies
drop policy if exists "Enable insert for users based on user_id" on business_information;
drop policy if exists "Read for users based on user_id" on business_information;
drop policy if exists "Service role has full access to business information" on business_information;
drop policy if exists "Users can insert their own business information" on business_information;
drop policy if exists "Users can update their own business information" on business_information;
drop policy if exists "Users can view shared websites" on business_information;
drop policy if exists "Users can view their own business information" on business_information;
drop policy if exists "Users can view websites they have access to" on business_information;

-- Recreate all policies
-- Service role full access
create policy "Service role has full access to business information"
on business_information for all
to service_role
using (true)
with check (true);

-- Insert policies
create policy "Users can insert their own business information"
on business_information for insert
to public
with check (auth.uid() = user_id);

-- Update policy
create policy "Users can update their own business information"
on business_information for update
to public
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Select policies
create policy "Users can view their own business information"
on business_information for select
to public
using (auth.uid() = user_id);

create policy "Users can view shared websites"
on business_information for select
to public
using (
  id in (
    select business_id from user_website_access
    where user_id = auth.uid()
  )
);

create policy "Users can view agency websites"
on business_information for select
to public
using (
  agency_id in (
    select id from agencies
    where owner_id = auth.uid()
  )
); 