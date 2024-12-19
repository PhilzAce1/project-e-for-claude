-- Create RPC for get_keyword_opportunities
create or replace function public.get_user_keyword_opportunities()
returns table (
    keyword text,
    search_volume integer,
    cpc decimal,
    competition float,
    keyword_difficulty integer,
    avg_position float,
    competitor_count integer,
    etv float,
    opportunity_score float,
    main_intent text,
    content_type text
) security definer
set search_path = public
language plpgsql as $$
begin
    return query
    select * from get_keyword_opportunities(auth.uid());
end;
$$;

-- Create RPC for get_next_content_recommendation
create or replace function public.get_user_content_recommendations()
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
) security definer
set search_path = public
language plpgsql as $$
begin
    return query
    select * from get_next_content_recommendation(auth.uid());
end;
$$;

-- Grant access to authenticated users
grant execute on function public.get_user_keyword_opportunities to authenticated;
grant execute on function public.get_user_content_recommendations to authenticated;