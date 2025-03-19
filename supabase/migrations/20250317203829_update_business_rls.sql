-- Drop existing policy
drop policy if exists "Users can view websites they have access to" on business_information;

-- Create updated policy that includes agency ownership
create policy "Users can view websites they have access to"
  on business_information for select
  using (
    exists (
      select 1 from user_website_access
      where user_id = auth.uid()
      and business_id = id
    ) 
    or auth.uid() = user_id
    or exists (
      select 1 from agencies
      where owner_id = auth.uid()
      and id = business_information.agency_id
    )
  ); 