-- Update competitors table to set business_id based on user_id relationship
update competitors c
set business_id = bi.id
from business_information bi
where bi.user_id = c.user_id
and c.business_id is null;

-- Log any records that couldn't be matched (optional)
select c.id, c.user_id, c.domain
from competitors c
where c.business_id is null;

-- Delete orphaned records that couldn't be matched
delete from competitors
where business_id is null;