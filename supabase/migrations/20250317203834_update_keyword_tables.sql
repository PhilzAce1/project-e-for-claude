-- First add business_id to keyword_suggestions
alter table keyword_suggestions
add column if not exists business_id uuid references business_information(id);

-- Update keyword_suggestions business_id
update keyword_suggestions ks
set business_id = bi.id
from business_information bi
where bi.user_id = ks.user_id
and ks.business_id is null;

-- Add business_id to muted_keywords
alter table muted_keywords
add column if not exists business_id uuid references business_information(id);

-- Update muted_keywords business_id
update muted_keywords mk
set business_id = bi.id
from business_information bi
where bi.user_id = mk.user_id
and mk.business_id is null;

-- Add business_id to seed_keyword_suggestions
alter table seed_keyword_suggestions
add column if not exists business_id uuid references business_information(id);

-- Update seed_keyword_suggestions business_id
update seed_keyword_suggestions sks
set business_id = bi.id
from business_information bi
where bi.user_id = sks.user_id
and sks.business_id is null;

-- Log any records that couldn't be matched (optional)
select 'keyword_suggestions' as table_name, count(*) as orphaned_records
from keyword_suggestions
where business_id is null
union all
select 'muted_keywords' as table_name, count(*) as orphaned_records
from muted_keywords
where business_id is null
union all
select 'seed_keyword_suggestions' as table_name, count(*) as orphaned_records
from seed_keyword_suggestions
where business_id is null;

-- Delete orphaned records
delete from keyword_suggestions where business_id is null;
delete from muted_keywords where business_id is null;
delete from seed_keyword_suggestions where business_id is null;

-- Add not null constraints
alter table keyword_suggestions alter column business_id set not null;
alter table muted_keywords alter column business_id set not null;
alter table seed_keyword_suggestions alter column business_id set not null; 