-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users with business access" ON competitors;
DROP POLICY IF EXISTS "Enable insert access for users with business access" ON competitors;
DROP POLICY IF EXISTS "Enable update access for users with business access" ON competitors;
DROP POLICY IF EXISTS "Enable delete access for users with business access" ON competitors;

-- Create new policies for competitors with legacy support
CREATE POLICY "Enable read access for users with business access" ON competitors
    FOR SELECT
    USING (
        business_id IN (
            SELECT business_id 
            FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable insert access for users with business access" ON competitors
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT business_id 
            FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable update access for users with business access" ON competitors
    FOR UPDATE
    USING (
        business_id IN (
            SELECT business_id 
            FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable delete access for users with business access" ON competitors
    FOR DELETE
    USING (
        business_id IN (
            SELECT business_id 
            FROM business_access_rights 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- Grant necessary permissions
GRANT ALL ON competitors TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON competitors TO authenticated; 