-- First become postgres (superuser)
SET ROLE postgres;

-- Grant schema permissions explicitly
GRANT ALL ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;

-- Drop ALL dependent policies first
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

-- Disable RLS temporarily
ALTER TABLE business_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_orders DISABLE ROW LEVEL SECURITY;

-- Force drop the materialized view with CASCADE
DROP MATERIALIZED VIEW IF EXISTS business_access_rights CASCADE;

-- Create the view as postgres
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

-- Re-enable RLS but bypass for service_role
ALTER TABLE business_information FORCE ROW LEVEL SECURITY;
ALTER TABLE business_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_information NO FORCE ROW LEVEL SECURITY;

ALTER TABLE competitors FORCE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors NO FORCE ROW LEVEL SECURITY;

ALTER TABLE content_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE content_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_orders NO FORCE ROW LEVEL SECURITY;

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
    WITH CHECK (user_id = auth.uid());

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

-- Grant ALL privileges to service_role
GRANT ALL PRIVILEGES ON business_information TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Reset role
RESET ROLE;