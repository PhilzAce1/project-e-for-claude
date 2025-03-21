-- First become postgres (superuser)
SET ROLE postgres;

-- Create function to sync business_access_rights
CREATE OR REPLACE FUNCTION sync_business_access_rights()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert access right for the creating user
    INSERT INTO business_access_rights (business_id, user_id, domain, created_at)
    VALUES (NEW.id, NEW.user_id, NEW.domain, NEW.created_at);

    -- Insert access right for service role
    INSERT INTO business_access_rights (business_id, user_id, domain, created_at)
    VALUES (NEW.id, '12340000-1234-1234-9876-987600001234'::uuid, NEW.domain, NEW.created_at);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_business_access_rights ON business_information;

-- Create the trigger
CREATE TRIGGER ensure_business_access_rights
    AFTER INSERT ON business_information
    FOR EACH ROW
    EXECUTE FUNCTION sync_business_access_rights();

-- Reset role
RESET ROLE; 