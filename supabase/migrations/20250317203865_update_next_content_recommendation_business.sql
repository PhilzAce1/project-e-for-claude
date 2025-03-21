-- Update the business version to use the new get_keyword_opportunities_by_business
create or replace function public.get_next_content_recommendation_by_business(business_id_param uuid)
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
BEGIN
    RETURN QUERY
    WITH competitor_opportunities AS (
        SELECT 
            co.keyword as kw,
            co.search_volume as sv,
            LEAST(100, GREATEST(0, 
                (LN(NULLIF(co.search_volume, 0) + 1) * 6) * 
                (1 - co.competition::FLOAT)
            ))::DOUBLE PRECISION as opp_score,
            co.content_type as content_cat,
            co.main_intent as intent,
            co.competitor_count as comp_count,
            'competitor_research'::TEXT as src,
            co.competition::TEXT as competition_level,
            co.cpc::DOUBLE PRECISION as cost_per_click,
            co.competition as competition_index
        FROM get_keyword_opportunities_by_business(business_id_param) co
        WHERE NOT EXISTS (
            SELECT 1 FROM muted_keywords mk 
            WHERE mk.business_id = business_id_param 
            AND mk.keyword = co.keyword
        )
    ),
    business_suggestions AS (
        SELECT 
            ks.keyword as kw,
            ks.search_volume as sv,
            LEAST(100, GREATEST(0, 
                ((LN(NULLIF(ks.search_volume, 0) + 1) * 6) * 
                (1 - (LEAST(ks.competition_index, 100)::FLOAT / 100))) * 1.2
            ))::DOUBLE PRECISION as opp_score,
            'Content'::TEXT as content_cat,
            'informational'::TEXT as intent,
            0 as comp_count,
            'business_analysis'::TEXT as src,
            ks.competition as competition_level,
            ks.cpc::DOUBLE PRECISION as cost_per_click,
            ks.competition_index/100 as competition_index
        FROM keyword_suggestions ks
        WHERE 
            ks.business_id = business_id_param
            AND (ks.content_completed IS NULL OR ks.content_completed = false)
            AND NOT EXISTS (
                SELECT 1 FROM muted_keywords mk 
                WHERE mk.business_id = business_id_param 
                AND mk.keyword = ks.keyword
            )
    )
    SELECT 
        co.kw as keyword,
        co.sv as search_volume,
        co.opp_score as opportunity_score,
        co.content_cat as content_type,
        co.intent as main_intent,
        co.comp_count as competitor_count,
        co.src as suggestion_source,
        co.competition_index::TEXT as competition,
        co.cost_per_click as cpc
    FROM (
        SELECT * FROM competitor_opportunities
        UNION ALL
        SELECT * FROM business_suggestions
    ) co
    WHERE co.sv > 0
    ORDER BY 
        co.opp_score DESC,
        co.sv DESC
    LIMIT 100;
END;
$$;

-- Grant access to authenticated users
grant execute on function public.get_next_content_recommendation_by_business(uuid) to authenticated; 