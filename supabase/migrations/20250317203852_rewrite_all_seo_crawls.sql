-- Set replica identity to full for the update
alter table seo_crawls replica identity full;

-- Update each row in seo_crawls
do $$
declare
    crawl_record record;
    matching_business_id uuid;
begin
    -- Loop through ALL crawls
    for crawl_record in 
        select id, user_id 
        from seo_crawls
    loop
        -- Find matching business_information record
        select id into matching_business_id
        from business_information
        where user_id = crawl_record.user_id
        limit 1;

        -- Update the seo_crawls record if we found a match
        if matching_business_id is not null then
            update seo_crawls
            set business_id = matching_business_id
            where id = crawl_record.id;
        end if;
    end loop;
end;
$$;

-- Log any records that couldn't be matched
select sc.id, sc.user_id, sc.business_id
from seo_crawls sc
where sc.business_id is null;

-- Set back to default
alter table seo_crawls replica identity default; 