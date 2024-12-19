-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create SERP analysis table
CREATE TABLE IF NOT EXISTS public.serp_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    keyword TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    search_volume INTEGER,
    serp_features JSONB,
    top_10_results JSONB,
    people_also_ask JSONB,
    related_searches JSONB,
    content_structure JSONB
);

-- Add RLS policies
ALTER TABLE public.serp_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SERP analysis"
    ON public.serp_analysis
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SERP analysis"
    ON public.serp_analysis
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX serp_analysis_user_id_idx ON public.serp_analysis(user_id);
CREATE INDEX serp_analysis_keyword_idx ON public.serp_analysis(keyword);

-- Create function to analyze and store SERP data
CREATE OR REPLACE FUNCTION public.analyze_serp_data(
    serp_data JSONB
) RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    new_analysis_id UUID;
BEGIN
    -- Validate input
    IF serp_data IS NULL OR serp_data->'result'->0 IS NULL THEN
        RAISE EXCEPTION 'Invalid SERP data structure';
    END IF;

    INSERT INTO serp_analysis (
        user_id,
        keyword,
        serp_features,
        top_10_results,
        people_also_ask,
        related_searches,
        content_structure
    )
    SELECT 
        auth.uid(),  -- Get the authenticated user's ID
        serp_data->'result'->0->>'keyword',
        jsonb_build_object(
            'item_types', serp_data->'result'->0->'item_types',
            'se_results_count', serp_data->'result'->0->>'se_results_count'
        ),
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'title', item->>'title',
                    'description', item->>'description',
                    'url', item->>'url',
                    'rank', item->>'rank_group'
                )
            )
            FROM jsonb_array_elements(serp_data->'result'->0->'items') item
            WHERE item->>'type' = 'organic'
            LIMIT 10
        ),
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'question', paa->'title',
                    'answer', paa->'expanded_element'->0->>'description'
                )
            )
            FROM jsonb_array_elements(
                (
                    SELECT item->'items'
                    FROM jsonb_array_elements(serp_data->'result'->0->'items') item
                    WHERE item->>'type' = 'people_also_ask'
                    LIMIT 1
                )
            ) paa
        ),
        (
            SELECT item->'items'
            FROM jsonb_array_elements(serp_data->'result'->0->'items') item
            WHERE item->>'type' = 'related_searches'
            LIMIT 1
        ),
        jsonb_build_object(
            'recommended_headings', (
                SELECT jsonb_agg(DISTINCT title)
                FROM jsonb_array_elements(serp_data->'result'->0->'items') item,
                jsonb_array_elements_text(item->'highlighted') title
                WHERE item->>'type' = 'organic'
            ),
            'key_topics', (
                SELECT jsonb_agg(DISTINCT question->>'title')
                FROM jsonb_array_elements(
                    (
                        SELECT item->'items'
                        FROM jsonb_array_elements(serp_data->'result'->0->'items') item
                        WHERE item->>'type' = 'people_also_ask'
                        LIMIT 1
                    )
                ) question
            )
        )
    RETURNING id INTO new_analysis_id;

    RETURN new_analysis_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.serp_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_serp_data TO authenticated;

-- Create helper function to get content structure
CREATE OR REPLACE FUNCTION public.get_content_structure(keyword_param TEXT)
RETURNS TABLE (
    keyword TEXT,
    serp_features JSONB,
    top_10_results JSONB,
    people_also_ask JSONB,
    related_searches JSONB,
    content_structure JSONB
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.keyword,
        sa.serp_features,
        sa.top_10_results,
        sa.people_also_ask,
        sa.related_searches,
        sa.content_structure
    FROM serp_analysis sa
    WHERE 
        sa.user_id = auth.uid()
        AND sa.keyword = keyword_param
    ORDER BY sa.created_at DESC
    LIMIT 1;
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.get_content_structure TO authenticated;