-- Drop existing policies
drop policy if exists "Users can view websites they have access to" on business_information;
drop policy if exists "Users can view their access roles" on user_website_access;

-- First drop the identity property
alter table business_information 
alter column id drop identity if exists;

-- Then convert to UUID
alter table business_information 
alter column id type uuid using (gen_random_uuid());

-- First, add business_id columns if they don't exist
alter table seo_crawls
add column if not exists business_id uuid;

alter table business_analyses
add column if not exists business_id uuid;

alter table website_scrapes
add column if not exists business_id uuid;

alter table user_website_access
add column if not exists business_id uuid;

-- Update foreign key references in related tables
alter table seo_crawls
alter column business_id type uuid using (gen_random_uuid());

alter table business_analyses
alter column business_id type uuid using (gen_random_uuid());

alter table website_scrapes
alter column business_id type uuid using (gen_random_uuid());

alter table user_website_access
alter column business_id type uuid using (gen_random_uuid());

-- Recreate policies
create policy "Users can view websites they have access to"
  on business_information for select
  using (
    exists (
      select 1 from user_website_access
      where user_id = auth.uid()
      and business_id = id
    ) or auth.uid() = user_id
  );

create policy "Users can view their access roles"
  on user_website_access for select
  using (auth.uid() = user_id);

-- Add default UUID generation for new records
alter table business_information 
alter column id set default gen_random_uuid();

-- Recreate indexes
drop index if exists idx_business_user_access;
drop index if exists idx_business_agency;
drop index if exists idx_seo_crawls_business;
drop index if exists idx_business_analyses_business;
drop index if exists idx_website_scrapes_business;

create index idx_business_user_access 
on user_website_access(business_id, user_id);

create index idx_business_agency 
on business_information(agency_id, id);

create index idx_seo_crawls_business 
on seo_crawls(business_id, created_at desc);

create index idx_business_analyses_business 
on business_analyses(business_id, created_at desc);

create index idx_website_scrapes_business 
on website_scrapes(business_id, created_at desc); 