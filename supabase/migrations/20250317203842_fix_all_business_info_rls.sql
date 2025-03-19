-- Drop all existing policies
drop policy if exists "Enable insert for users based on user_id" on business_information;
drop policy if exists "Read for users based on user_id" on business_information;
drop policy if exists "Service role has full access to business information" on business_information;
drop policy if exists "Users can insert their own business information" on business_information;
drop policy if exists "Users can update their own business information" on business_information;
drop policy if exists "Users can view shared websites" on business_information;
drop policy if exists "Users can view their own business information" on business_information;
drop policy if exists "Users can view websites they have access to" on business_information;
drop policy if exists "Users can view agency websites" on business_information;

-- Service role full access
create policy "Service role has full access to business information"
on business_information for all
to service_role
using (true)
with check (true);

-- Direct ownership policies
create policy "Users can manage their own business information"
on business_information for all
to public
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create a materialized view for access rights
create materialized view if not exists business_access_rights as
select distinct business_id, user_id from user_website_access
union
select distinct bi.id as business_id, a.owner_id as user_id
from business_information bi
join agencies a on a.id = bi.agency_id;

-- Shared and agency access policy using materialized view
create policy "Users can view accessible websites"
on business_information for select
to public
using (
  id in (
    select business_id from business_access_rights
    where user_id = auth.uid()
  )
);

-- Create refresh function
create or replace function refresh_business_access_rights()
returns trigger as $$
begin
  refresh materialized view business_access_rights;
  return null;
end;
$$ language plpgsql;

-- Create triggers to refresh the materialized view
create trigger refresh_business_access_rights_user_website_access
after insert or update or delete or truncate
on user_website_access
for each statement
execute function refresh_business_access_rights();

create trigger refresh_business_access_rights_business_information
after insert or update or delete or truncate
on business_information
for each statement
execute function refresh_business_access_rights();

create trigger refresh_business_access_rights_agencies
after insert or update or delete or truncate
on agencies
for each statement
execute function refresh_business_access_rights(); 