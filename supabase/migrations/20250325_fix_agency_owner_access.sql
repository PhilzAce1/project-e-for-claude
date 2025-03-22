-- Apply policies to business_analyses
DROP POLICY IF EXISTS "Agency owners can view business analyses" ON business_analyses;
CREATE POLICY "Agency owners can view business analyses" ON business_analyses
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM business_information 
            WHERE agency_id IN (
                SELECT id FROM agencies 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- Apply policies to business_analysis_answers
DROP POLICY IF EXISTS "Agency owners can view analysis answers" ON business_analysis_answers;
CREATE POLICY "Agency owners can view analysis answers" ON business_analysis_answers
    FOR SELECT USING (
        analysis_id IN (
            SELECT id FROM business_analyses 
            WHERE business_id IN (
                SELECT id FROM business_information 
                WHERE agency_id IN (
                    SELECT id FROM agencies 
                    WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- Apply policies to seo_crawls
DROP POLICY IF EXISTS "Agency owners can view SEO crawls" ON seo_crawls;
CREATE POLICY "Agency owners can view SEO crawls" ON seo_crawls
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM business_information 
            WHERE agency_id IN (
                SELECT id FROM agencies 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- Apply policies to competitors
DROP POLICY IF EXISTS "Agency owners can view competitors" ON competitors;
CREATE POLICY "Agency owners can view competitors" ON competitors
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM business_information 
            WHERE agency_id IN (
                SELECT id FROM agencies 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- Apply policies to keyword_suggestions
DROP POLICY IF EXISTS "Agency owners can view keyword suggestions" ON keyword_suggestions;
CREATE POLICY "Agency owners can view keyword suggestions" ON keyword_suggestions
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM business_information 
            WHERE agency_id IN (
                SELECT id FROM agencies 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- Apply policies to seed_keyword_suggestions
DROP POLICY IF EXISTS "Agency owners can view seed keyword suggestions" ON seed_keyword_suggestions;
CREATE POLICY "Agency owners can view seed keyword suggestions" ON seed_keyword_suggestions
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM business_information 
            WHERE agency_id IN (
                SELECT id FROM agencies 
                WHERE owner_id = auth.uid()
            )
        )
    ); 