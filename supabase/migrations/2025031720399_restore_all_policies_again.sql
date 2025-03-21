-- First become postgres (superuser)
SET ROLE postgres;

-- Drop all existing policies first
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Business Information policies
CREATE POLICY "Enable read access for users with business access" ON business_information
    FOR SELECT USING (id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Enable insert access for users with business access" ON business_information
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Enable update access for users with business access" ON business_information
    FOR UPDATE USING (id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Enable delete access for users with business access" ON business_information
    FOR DELETE USING (id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()) OR user_id = auth.uid());

-- Competitors policies
CREATE POLICY "Enable read access for users with business access" ON competitors
    FOR SELECT USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable insert access for users with business access" ON competitors
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable update access for users with business access" ON competitors
    FOR UPDATE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable delete access for users with business access" ON competitors
    FOR DELETE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));

-- Content Orders policies
CREATE POLICY "Enable read access for users with business access" ON content_orders
    FOR SELECT USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable insert access for users with business access" ON content_orders
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable update access for users with business access" ON content_orders
    FOR UPDATE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));

-- SEO Crawls policies
CREATE POLICY "Enable read access for users with business access" ON seo_crawls
    FOR SELECT USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable insert access for users with business access" ON seo_crawls
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable update access for users with business access" ON seo_crawls
    FOR UPDATE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable delete access for users with business access" ON seo_crawls
    FOR DELETE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));

-- Business Analyses policies
CREATE POLICY "Enable read access for users with business access" ON business_analyses
    FOR SELECT USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable insert access for users with business access" ON business_analyses
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable update access for users with business access" ON business_analyses
    FOR UPDATE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable delete access for users with business access" ON business_analyses
    FOR DELETE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));

-- Business Analysis Answers policies
CREATE POLICY "Enable read access for users with business access" ON business_analysis_answers
    FOR SELECT USING (analysis_id IN (SELECT id FROM business_analyses WHERE business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())));
CREATE POLICY "Enable insert access for users with business access" ON business_analysis_answers
    FOR INSERT WITH CHECK (analysis_id IN (SELECT id FROM business_analyses WHERE business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())));
CREATE POLICY "Enable update access for users with business access" ON business_analysis_answers
    FOR UPDATE USING (analysis_id IN (SELECT id FROM business_analyses WHERE business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())));
CREATE POLICY "Enable delete access for users with business access" ON business_analysis_answers
    FOR DELETE USING (analysis_id IN (SELECT id FROM business_analyses WHERE business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())));

-- Website Scrapes policies
CREATE POLICY "Enable read access for users with business access" ON website_scrapes
    FOR SELECT USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable insert access for users with business access" ON website_scrapes
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable update access for users with business access" ON website_scrapes
    FOR UPDATE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));
CREATE POLICY "Enable delete access for users with business access" ON website_scrapes
    FOR DELETE USING (business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()));

-- Make sure RLS is enabled on all tables
ALTER TABLE business_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_crawls ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_analysis_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scrapes ENABLE ROW LEVEL SECURITY;

-- Reset role
RESET ROLE; 