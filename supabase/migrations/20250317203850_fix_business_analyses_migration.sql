-- First, ensure we have the business_id column
alter table business_analyses
add column if not exists business_id uuid references business_information(id);

-- Set replica identity to full for the update
alter table business_analyses replica identity full;

-- Update each row in business_analyses
do $$
declare
    analysis_record record;
    matching_business_id uuid;
begin
    -- Loop through each analysis
    for analysis_record in 
        select id, user_id 
        from business_analyses 
        where business_id is null
    loop
        -- Find matching business_information record
        select id into matching_business_id
        from business_information
        where user_id = analysis_record.user_id
        limit 1;

        -- Update the business_analyses record if we found a match
        if matching_business_id is not null then
            update business_analyses
            set business_id = matching_business_id
            where id = analysis_record.id;
        end if;
    end loop;
end;
$$;

-- Log any records that couldn't be matched (optional)
select ba.id, ba.user_id
from business_analyses ba
where ba.business_id is null;

-- Set back to default
alter table business_analyses replica identity default; 