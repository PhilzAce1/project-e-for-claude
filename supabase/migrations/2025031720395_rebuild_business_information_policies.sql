-- First become postgres (superuser)
SET ROLE postgres;

-- Drop existing business_information policies
DROP POLICY IF EXISTS "Enable read access for users with business access" ON business_information;
DROP POLICY IF EXISTS "Enable insert access for users with business access" ON business_information;
DROP POLICY IF EXISTS "Enable update access for users with business access" ON business_information;
DROP POLICY IF EXISTS "Enable delete access for users with business access" ON business_information;

-- Recreate business_information policies
CREATE POLICY "Enable read access for users with business access" ON business_information
    FOR SELECT USING (id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Enable insert access for users with business access" ON business_information
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Enable update access for users with business access" ON business_information
    FOR UPDATE USING (id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Enable delete access for users with business access" ON business_information
    FOR DELETE USING (id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid()) OR user_id = auth.uid());

-- Make sure RLS is enabled
ALTER TABLE business_information ENABLE ROW LEVEL SECURITY;

-- Reset role
RESET ROLE; 