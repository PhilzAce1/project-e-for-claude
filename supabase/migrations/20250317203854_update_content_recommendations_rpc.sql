-- Drop the existing function
drop function if exists get_user_content_recommendations;

-- Create new function using business_id
create or replace function get_user_content_recommendations(business_id_param uuid)
returns table (
    id uuid,
    created_at timestamptz,
    keyword text,
    search_volume int,
    keyword_difficulty int,
    cpc numeric,
    competition numeric,
    search_intent text,
    content_type text,
    title text,
    outline text,
    status text,
    business_id uuid,
    user_id uuid
) 
language plpgsql
security definer
as $$
begin
    return query
    select 
        cr.id,
        cr.created_at,
        cr.keyword,
        cr.search_volume,
        cr.keyword_difficulty,
        cr.cpc,
        cr.competition,
        cr.search_intent,
        cr.content_type,
        cr.title,
        cr.outline,
        cr.status,
        cr.business_id,
        cr.user_id
    from content_recommendations cr
    where cr.business_id = business_id_param
    order by cr.created_at desc;
end;
$$; 