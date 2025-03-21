-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users with business or agency access" ON business_information;
DROP POLICY IF EXISTS "Enable insert access for users with business or agency access" ON business_information;
DROP POLICY IF EXISTS "Enable update access for users with business or agency access" ON business_information;
DROP POLICY IF EXISTS "Enable delete access for users with business or agency access" ON business_information;

-- Create new policies with legacy support
CREATE POLICY "Enable read access for users with business access" ON business_information
    FOR SELECT
    USING (
        id IN (
            SELECT business_id 
            FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable insert access for users with business access" ON business_information
    FOR INSERT
    WITH CHECK (
        id IN (
            SELECT business_id 
            FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable update access for users with business access" ON business_information
    FOR UPDATE
    USING (
        id IN (
            SELECT business_id 
            FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable delete access for users with business access" ON business_information
    FOR DELETE
    USING (
        id IN (
            SELECT business_id 
            FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- Grant necessary permissions
GRANT ALL ON business_information TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON business_information TO authenticated; 