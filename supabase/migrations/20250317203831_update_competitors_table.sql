-- First drop all policies
drop policy if exists "Users can view competitors" on competitors;
drop policy if exists "Enable insert for authenticated users only" on competitors;
drop policy if exists "Enable read access for all users" on competitors;

-- Drop any foreign key constraints
alter table competitors
drop constraint if exists competitors_user_id_fkey;

-- Drop primary key constraint first
alter table competitors
drop constraint if exists competitors_pkey cascade;

-- Drop any indexes that might reference user_id
drop index if exists idx_competitors_user_id;
drop index if exists competitors_user_id_idx;
drop index if exists competitors_user_id_domain_key;

-- Add business_id column
alter table competitors
add column if not exists business_id uuid references business_information(id);

-- Copy data from user relationships to business relationships
update competitors c
set business_id = bi.id
from business_information bi
where bi.user_id = c.user_id
and c.business_id is null;

-- Delete any orphaned records that couldn't be migrated
delete from competitors
where business_id is null;

-- Now we can safely add the not null constraint
alter table competitors
alter column business_id set not null;

-- Recreate any needed indexes
create index if not exists idx_competitors_business_id on competitors(business_id);

-- Recreate the policy
create policy "Users can view competitors"
on competitors for select
using (
  exists (
    select 1 from business_information
    where business_information.id = competitors.business_id
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