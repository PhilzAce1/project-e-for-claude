-- First become postgres (superuser)
SET ROLE postgres;

-- Drop and recreate the table with explicit ownership
DROP TABLE IF EXISTS business_access_rights CASCADE;

CREATE TABLE business_access_rights (
    business_id UUID NOT NULL,
    user_id UUID NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ,
    PRIMARY KEY (business_id, user_id)
);

-- Set ownership explicitly
ALTER TABLE business_access_rights OWNER TO postgres;

-- Populate data
INSERT INTO business_access_rights
SELECT DISTINCT
    bi.id as business_id,
    bi.user_id,
    bi.domain,
    bi.created_at
FROM business_information bi
WHERE bi.id IS NOT NULL
AND bi.user_id IS NOT NULL;

-- Grant ALL privileges with explicit options
GRANT ALL PRIVILEGES ON TABLE business_access_rights TO postgres;
GRANT ALL PRIVILEGES ON TABLE business_access_rights TO service_role;
GRANT SELECT ON TABLE business_access_rights TO authenticated;
GRANT SELECT ON TABLE business_access_rights TO anon;

-- Make sure RLS is properly configured
ALTER TABLE business_access_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_access_rights NO FORCE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Enable read access for all" ON business_access_rights
    FOR SELECT USING (true);

-- Reset role
RESET ROLE; 