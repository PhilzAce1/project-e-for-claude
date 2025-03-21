-- Drop existing functions
drop function if exists get_user_content_recommendations(uuid);
drop function if exists get_user_content_recommendations();

-- Create function with business_id parameter
create or replace function get_user_content_recommendations(business_id_param uuid)
returns table (
    keyword text,
    search_volume integer,
    opportunity_score double precision,
    content_type text,
    main_intent text,
    competitor_count integer,
    suggestion_source text,
    competition text,
    cpc double precision
) 
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select 
        cr.keyword,
        cr.search_volume,
        cr.opportunity_score,
        cr.content_type,
        cr.main_intent,
        cr.competitor_count,
        cr.suggestion_source,
        cr.competition,
        cr.cpc
    from content_recommendations cr
    where cr.business_id = business_id_param
    order by cr.created_at desc;
end;
$$;

-- Create function without parameters (uses auth.uid())
create or replace function get_user_content_recommendations()
returns table (
    keyword text,
    search_volume integer,
    opportunity_score double precision,
    content_type text,
    main_intent text,
    competitor_count integer,
    suggestion_source text,
    competition text,
    cpc double precision
) 
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select 
        cr.keyword,
        cr.search_volume,
        cr.opportunity_score,
        cr.content_type,
        cr.main_intent,
        cr.competitor_count,
        cr.suggestion_source,
        cr.competition,
        cr.cpc
    from content_recommendations cr
    where cr.user_id = auth.uid()
    order by cr.created_at desc;
end;
$$;

-- Grant access to authenticated users
grant execute on function public.get_user_content_recommendations(uuid) to authenticated; 