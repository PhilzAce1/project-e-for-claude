-- Set replica identity to FULL for the update
alter table business_analyses replica identity full;

-- Copy data from user relationships to business relationships
update business_analyses ba
set business_id = bi.id
from business_information bi
where bi.user_id = ba.user_id
and ba.business_id is null;

-- Set back to DEFAULT if needed
alter table business_analyses replica identity default; 