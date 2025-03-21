-- First become postgres (superuser)
SET ROLE postgres;

-- Grant schema permissions explicitly
GRANT ALL ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;

-- Drop all dependent policies first
DROP POLICY IF EXISTS "Enable read access for users with business access" ON business_information;
DROP POLICY IF EXISTS "Enable insert access for users with business access" ON business_information;
DROP POLICY IF EXISTS "Enable update access for users with business access" ON business_information;
DROP POLICY IF EXISTS "Enable delete access for users with business access" ON business_information;

DROP POLICY IF EXISTS "Enable read access for users with business access" ON competitors;
DROP POLICY IF EXISTS "Enable insert access for users with business access" ON competitors;
DROP POLICY IF EXISTS "Enable update access for users with business access" ON competitors;
DROP POLICY IF EXISTS "Enable delete access for users with business access" ON competitors;

DROP POLICY IF EXISTS "Enable read access for users with business access" ON content_orders;
DROP POLICY IF EXISTS "Enable insert access for users with business access" ON content_orders;
DROP POLICY IF EXISTS "Enable update access for users with business access" ON content_orders;

-- Force drop the materialized view with CASCADE
DROP MATERIALIZED VIEW IF EXISTS business_access_rights CASCADE;

-- Create the view
CREATE MATERIALIZED VIEW public.business_access_rights AS
SELECT DISTINCT
    bi.id as business_id,
    bi.user_id,
    bi.domain,
    bi.created_at
FROM business_information bi
WHERE bi.id IS NOT NULL
AND bi.user_id IS NOT NULL;

-- Grant ALL privileges to service_role
GRANT ALL PRIVILEGES ON public.business_access_rights TO service_role;
GRANT SELECT ON public.business_access_rights TO authenticated;
GRANT SELECT ON public.business_access_rights TO anon;

-- Refresh the view
REFRESH MATERIALIZED VIEW public.business_access_rights;

-- Recreate the policies
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

-- Reset role
RESET ROLE;
