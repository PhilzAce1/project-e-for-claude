CREATE OR REPLACE FUNCTION get_keyword_opportunities_by_business(business_id_param UUID)
RETURNS TABLE (
    keyword TEXT,
    search_volume INTEGER,
    cpc DECIMAL,
    competition FLOAT,
    keyword_difficulty INTEGER,
    avg_position FLOAT,
    competitor_count INTEGER,
    etv FLOAT,
    opportunity_score FLOAT,
    main_intent TEXT,
    content_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH unnested_keywords AS (
        -- Unnest the items array from each competitor
        SELECT 
            c.id as competitor_id,
            jsonb_array_elements(c.items) as kw_data
        FROM competitors c
        WHERE c.business_id = business_id_param
    ),
    processed_keywords AS (
        -- Group and analyze keywords
        SELECT 
            kw_data->'keyword_data'->>'keyword' as kw_text,
            (kw_data->'keyword_data'->'keyword_info'->>'search_volume')::INTEGER as sv,
            (kw_data->'keyword_data'->'keyword_info'->>'cpc')::DECIMAL as cost_per_click,
            COALESCE((kw_data->'keyword_data'->'keyword_info'->>'competition')::FLOAT, 1.0) as comp_level,
            (kw_data->'keyword_data'->'keyword_properties'->>'keyword_difficulty')::INTEGER as difficulty,
            (kw_data->'ranked_serp_element'->'serp_item'->>'rank_absolute')::FLOAT as rank_pos,
            COUNT(DISTINCT competitor_id)::INTEGER as comp_count,
            (kw_data->'ranked_serp_element'->'serp_item'->>'etv')::FLOAT as traffic_value,
            kw_data->'keyword_data'->'search_intent_info'->>'main_intent' as intent_type,
            CASE 
                WHEN kw_data->'keyword_data'->'search_intent_info'->>'main_intent' = 'informational' THEN 
                    CASE 
                        WHEN kw_data->'keyword_data'->>'keyword' ILIKE 'how%' THEN 'How-to Guide'
                        WHEN kw_data->'keyword_data'->>'keyword' ILIKE 'what%' THEN 'Explanatory Article'
                        WHEN kw_data->'keyword_data'->>'keyword' ILIKE 'why%' THEN 'In-depth Analysis'
                        ELSE 'Educational Content'
                    END
                WHEN kw_data->'keyword_data'->'search_intent_info'->>'main_intent' = 'commercial' THEN 'Product/Service Page'
                WHEN kw_data->'keyword_data'->'search_intent_info'->>'main_intent' = 'navigational' THEN 'Landing Page'
                WHEN kw_data->'keyword_data'->'search_intent_info'->>'main_intent' = 'transactional' THEN 'Conversion Page'
                ELSE 'General Content'
            END as content_category,
            -- Normalized opportunity score focused on organic traffic potential (0-100)
            LEAST(100, GREATEST(0, 
                COALESCE(
                    (
                        -- Search volume impact (40% weight)
                        (LN(NULLIF((kw_data->'keyword_data'->'keyword_info'->>'search_volume')::INTEGER, 0) + 1) * 40) * 
                        -- Competition inverse (30% weight)
                        (1 - COALESCE((kw_data->'keyword_data'->'keyword_info'->>'competition')::FLOAT, 0)) * 3 * 
                        -- Difficulty inverse (30% weight)
                        (1 - (LEAST(COALESCE((kw_data->'keyword_data'->'keyword_properties'->>'keyword_difficulty')::INTEGER, 0), 100)::FLOAT / 100)) * 3
                    ) / 100,
                    0
                )
            )) as opp_score
        FROM unnested_keywords
        GROUP BY 
            kw_data->'keyword_data'->>'keyword',
            kw_data->'keyword_data'->'keyword_info'->>'search_volume',
            kw_data->'keyword_data'->'keyword_info'->>'cpc',
            kw_data->'keyword_data'->'keyword_info'->>'competition',
            kw_data->'keyword_data'->'keyword_properties'->>'keyword_difficulty',
            kw_data->'ranked_serp_element'->'serp_item'->>'rank_absolute',
            kw_data->'ranked_serp_element'->'serp_item'->>'etv',
            kw_data->'keyword_data'->'search_intent_info'->>'main_intent'
    )
    SELECT 
        kw_text as keyword,
        sv as search_volume,
        cost_per_click as cpc,
        comp_level as competition,
        difficulty as keyword_difficulty,
        rank_pos as avg_position,
        comp_count as competitor_count,
        traffic_value as etv,
        opp_score as opportunity_score,
        intent_type as main_intent,
        content_category as content_type
    FROM processed_keywords
    WHERE 
        sv > 0
        AND difficulty < 60
        AND comp_level < 1
    ORDER BY opp_score DESC NULLS LAST
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Grant access to authenticated users
grant execute on function public.get_keyword_opportunities_by_business(uuid) to authenticated; 