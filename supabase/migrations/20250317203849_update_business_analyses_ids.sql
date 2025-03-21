-- Set replica identity to FULL for the update
alter table business_analyses replica identity full;

-- Update business_id for each business_analysis, taking the most recent business_information record for each user
with ranked_businesses as (
  select id, user_id,
    row_number() over (partition by user_id order by created_at desc) as rn
  from business_information
)
update business_analyses ba
set business_id = rb.id
from ranked_businesses rb
where rb.user_id = ba.user_id
and rb.rn = 1
and ba.business_id is null;

-- Log any records that couldn't be matched (optional)
select ba.id, ba.user_id
from business_analyses ba
where ba.business_id is null;

-- Set back to DEFAULT if needed
alter table business_analyses replica identity default; 