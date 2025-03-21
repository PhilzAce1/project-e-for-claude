-- Drop existing policy
drop policy if exists "Users can view business analyses" on business_analyses;

-- Create simplified policy
create policy "Users can view business analyses"
on business_analyses for select
using (
  business_id in (
    select id from business_information
    where user_id = auth.uid()
    or id in (
      select business_id from user_website_access
      where user_id = auth.uid()
    )
    or agency_id in (
      select id from agencies
      where owner_id = auth.uid()
    )
  )
); 