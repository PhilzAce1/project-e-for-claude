-- First become postgres (superuser)
SET ROLE postgres;

-- Drop the materialized view
DROP MATERIALIZED VIEW IF EXISTS business_access_rights CASCADE;

-- Create as regular view
CREATE VIEW business_access_rights AS
SELECT DISTINCT
    bi.id as business_id,
    bi.user_id,
    bi.domain,
    bi.created_at
FROM business_information bi
WHERE bi.id IS NOT NULL
AND bi.user_id IS NOT NULL;

-- Grant permissions
GRANT ALL ON business_access_rights TO service_role;
GRANT SELECT ON business_access_rights TO authenticated;
GRANT SELECT ON business_access_rights TO anon;

-- Reset role
RESET ROLE; 