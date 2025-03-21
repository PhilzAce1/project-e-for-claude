-- First become postgres (superuser)
SET ROLE postgres;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS ensure_service_role_access ON business_information CASCADE;
DROP FUNCTION IF EXISTS add_service_role_access() CASCADE;

-- Insert service_role access for all businesses
INSERT INTO business_access_rights (business_id, user_id, domain, created_at)
SELECT 
    id as business_id,
    '12340000-1234-1234-9876-987600001234'::uuid as user_id, -- service role user id
    domain,
    created_at
FROM business_information
ON CONFLICT (business_id, user_id) DO NOTHING;

-- Create a trigger to automatically add service_role access for new businesses
CREATE OR REPLACE FUNCTION add_service_role_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO business_access_rights (business_id, user_id, domain, created_at)
    VALUES (NEW.id, '12340000-1234-1234-9876-987600001234'::uuid, NEW.domain, NEW.created_at)
    ON CONFLICT (business_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_service_role_access
    AFTER INSERT ON business_information
    FOR EACH ROW
    EXECUTE FUNCTION add_service_role_access();

-- Reset role
RESET ROLE; 