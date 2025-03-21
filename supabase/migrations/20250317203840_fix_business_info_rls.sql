-- Drop existing policies
drop policy if exists "Users can view websites they have access to" on business_information;
drop policy if exists "Users can view shared websites" on business_information;
drop policy if exists "Agency owners can view their websites" on business_information;

-- Create simplified policy
create policy "Users can view websites they have access to"
on business_information for select
using (
  auth.uid() = user_id
);

-- Create separate policy for shared access
create policy "Users can view shared websites"
on business_information for select
using (
  id in (
    select business_id from user_website_access
    where user_id = auth.uid()
  )
);
