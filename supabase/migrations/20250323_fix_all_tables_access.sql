-- Apply policies to business_analyses
DROP POLICY IF EXISTS "Users can view business analyses" ON business_analyses;
CREATE POLICY "Users can view business analyses" ON business_analyses
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM business_information 
            WHERE id IN (
                SELECT business_id FROM business_access_rights 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Apply policies to business_analysis_answers
DROP POLICY IF EXISTS "Users can view analysis answers" ON business_analysis_answers;
CREATE POLICY "Users can view analysis answers" ON business_analysis_answers
    FOR SELECT USING (
        analysis_id IN (
            SELECT id FROM business_analyses 
            WHERE business_id IN (
                SELECT business_id FROM business_access_rights 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Apply policies to seo_crawls
DROP POLICY IF EXISTS "Users can view SEO crawls" ON seo_crawls;
CREATE POLICY "Users can view SEO crawls" ON seo_crawls
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
    );

-- Apply policies to competitors
DROP POLICY IF EXISTS "Users can view competitors" ON competitors;
CREATE POLICY "Users can view competitors" ON competitors
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
    );

-- Apply policies to keyword_suggestions
DROP POLICY IF EXISTS "Enable read access for users with business access" ON keyword_suggestions;
CREATE POLICY "Enable read access for users with business access" ON keyword_suggestions
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
    );

-- Apply policies to seed_keyword_suggestions
DROP POLICY IF EXISTS "Enable read access for users with business access" ON seed_keyword_suggestions;
CREATE POLICY "Enable read access for users with business access" ON seed_keyword_suggestions
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
    ); 