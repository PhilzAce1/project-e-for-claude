-- Drop existing function if it exists
drop function if exists public.get_user_content_recommendations();

-- Create RPC for get_next_content_recommendation with edge function trigger
create or replace function public.get_user_content_recommendations(user_id_param uuid default auth.uid())
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
declare
    v_first_keyword text;
begin
    -- Create temporary table to store results
    create temp table temp_recommendations as
    select * from get_next_content_recommendation(user_id_param);
    
    -- -- Get the first keyword for the edge function
    -- select temp_recommendations.keyword into v_first_keyword 
    -- from temp_recommendations 
    -- limit 1;

    -- -- If we found a keyword, trigger the edge function
    -- if v_first_keyword is not null then
    --     perform net.http_post(
    --         url := 'https://app.espy-go.com/api/get-detailed-content-recommendation',
    --         headers := jsonb_build_object(
    --             'Content-Type', 'application/json'
    --         ),
    --         body := jsonb_build_object(
    --             'user_id', user_id_param,
    --             'keyword', v_first_keyword
    --         )
    --     );
    -- end if;

    -- Return results from temporary table
    return query select * from temp_recommendations;
end;
$$;

-- Grant access to authenticated users
grant execute on function public.get_user_content_recommendations(uuid) to authenticated;