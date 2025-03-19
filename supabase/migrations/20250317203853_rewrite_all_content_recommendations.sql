-- First add the business_id column
alter table content_recommendations
add column if not exists business_id uuid references business_information(id);

-- Set replica identity to full for the update
alter table content_recommendations replica identity full;

-- Update each row in content_recommendations
do $$
declare
    recommendation_record record;
    matching_business_id uuid;
begin
    -- Loop through ALL recommendations
    for recommendation_record in 
        select id, user_id 
        from content_recommendations
    loop
        -- Find matching business_information record
        select id into matching_business_id
        from business_information
        where user_id = recommendation_record.user_id
        limit 1;

        -- Update the content_recommendations record if we found a match
        if matching_business_id is not null then
            update content_recommendations
            set business_id = matching_business_id
            where id = recommendation_record.id;
        end if;
    end loop;
end;
$$;

-- Log any records that couldn't be matched
select cr.id, cr.user_id, cr.business_id
from content_recommendations cr
where cr.business_id is null;

-- Set back to default
alter table content_recommendations replica identity default; 