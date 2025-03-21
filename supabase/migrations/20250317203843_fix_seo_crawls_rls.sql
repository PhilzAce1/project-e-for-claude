-- Drop existing policies
drop policy if exists "Users can view SEO crawls" on seo_crawls;

-- Create simplified policy using our materialized view
create policy "Users can view SEO crawls"
on seo_crawls for select
to public
using (
  business_id in (
    select id from business_information
    where user_id = auth.uid()
  )
  or business_id in (
    select business_id from business_access_rights
    where user_id = auth.uid()
  )
);

-- Add service role access
create policy "Service role has full access to SEO crawls"
on seo_crawls for all
to service_role
using (true)
with check (true); 