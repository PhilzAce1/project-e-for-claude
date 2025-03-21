-- Drop existing policies first
drop policy if exists "Users can view and search SEO crawls" on seo_crawls;
drop policy if exists "Users can view SEO crawls" on seo_crawls;
drop policy if exists "Service role has full access to SEO crawls" on seo_crawls;

-- Create new policy
create policy "Users can view SEO crawls"
on seo_crawls for select
using (
  exists (
    select 1 from business_information
    where business_information.id = seo_crawls.business_id
    and (
      business_information.user_id = auth.uid()
      or exists (
        select 1 from user_website_access
        where user_id = auth.uid()
        and business_id = business_information.id
      )
      or exists (
        select 1 from agencies
        where owner_id = auth.uid()
        and id = business_information.agency_id
      )
    )
  )
);

-- Service role access
create policy "Service role has full access to SEO crawls"
on seo_crawls for all
to service_role
using (true)
with check (true); 