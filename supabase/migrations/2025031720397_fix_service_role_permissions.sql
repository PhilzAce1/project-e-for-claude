-- First become postgres (superuser)
SET ROLE postgres;

-- Ensure postgres owns the table
ALTER TABLE business_access_rights OWNER TO postgres;

-- Grant ALL privileges to service_role
GRANT ALL PRIVILEGES ON TABLE business_access_rights TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Make sure RLS is properly configured
ALTER TABLE business_access_rights FORCE ROW LEVEL SECURITY;
ALTER TABLE business_access_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_access_rights NO FORCE ROW LEVEL SECURITY;

-- Add explicit permissions for the metrics column
GRANT ALL PRIVILEGES ON TABLE business_information TO service_role;
ALTER TABLE business_information NO FORCE ROW LEVEL SECURITY;

-- Reset role
RESET ROLE; 