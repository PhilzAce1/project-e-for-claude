-- Drop existing policies
drop policy if exists "Users can view analysis answers" on business_analysis_answers;
drop policy if exists "Users can view their own analysis answers" on business_analysis_answers;

-- Create simplified policy
create policy "Users can view analysis answers"
on business_analysis_answers for select
using (
  analysis_id in (
    select id from business_analyses
    where business_id in (
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
  )
); 