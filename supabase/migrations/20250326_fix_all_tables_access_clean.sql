-- Apply policies to business_analyses
DROP POLICY IF EXISTS "Users can view business analyses" ON business_analyses;
CREATE POLICY "Users can view business analyses" ON business_analyses
    FOR SELECT
    TO authenticated
    USING (
        check_business_access(business_id, auth.uid())
    );

-- Apply policies to business_analysis_answers
DROP POLICY IF EXISTS "Users can view analysis answers" ON business_analysis_answers;
CREATE POLICY "Users can view analysis answers" ON business_analysis_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM business_analyses 
            WHERE id = analysis_id 
            AND check_business_access(business_id, auth.uid())
        )
    );

-- Apply policies to seo_crawls
DROP POLICY IF EXISTS "Users can view SEO crawls" ON seo_crawls;
CREATE POLICY "Users can view SEO crawls" ON seo_crawls
    FOR SELECT
    TO authenticated
    USING (
        check_business_access(business_id, auth.uid())
    );

-- Apply policies to competitors
DROP POLICY IF EXISTS "Users can view competitors" ON competitors;
CREATE POLICY "Users can view competitors" ON competitors
    FOR SELECT
    TO authenticated
    USING (
        check_business_access(business_id, auth.uid())
    );

-- Apply policies to keyword_suggestions
DROP POLICY IF EXISTS "Users can view keyword suggestions" ON keyword_suggestions;
CREATE POLICY "Users can view keyword suggestions" ON keyword_suggestions
    FOR SELECT
    TO authenticated
    USING (
        check_business_access(business_id, auth.uid())
    );

-- Apply policies to seed_keyword_suggestions
DROP POLICY IF EXISTS "Users can view seed keyword suggestions" ON seed_keyword_suggestions;
CREATE POLICY "Users can view seed keyword suggestions" ON seed_keyword_suggestions
    FOR SELECT
    TO authenticated
    USING (
        check_business_access(business_id, auth.uid())
    ); 