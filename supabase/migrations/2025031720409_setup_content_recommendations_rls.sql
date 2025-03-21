-- First become postgres (superuser)
SET ROLE postgres;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for users with business access" ON content_recommendations;
DROP POLICY IF EXISTS "Enable insert access for users with business access" ON content_recommendations;
DROP POLICY IF EXISTS "Enable update access for users with business access" ON content_recommendations;
DROP POLICY IF EXISTS "Enable delete access for users with business access" ON content_recommendations;

-- Create policies for content_recommendations
CREATE POLICY "Enable read access for users with business access" ON content_recommendations
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable insert access for users with business access" ON content_recommendations
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable update access for users with business access" ON content_recommendations
    FOR UPDATE USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable delete access for users with business access" ON content_recommendations
    FOR DELETE USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

-- Make sure RLS is enabled
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;

-- Reset role
RESET ROLE; 