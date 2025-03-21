-- First become postgres (superuser)
SET ROLE postgres;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION sync_agency_business_access()
RETURNS TRIGGER AS $$
BEGIN
    -- If agency_id is being set or changed
    IF (TG_OP = 'INSERT' AND NEW.agency_id IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND (OLD.agency_id IS NULL OR OLD.agency_id != NEW.agency_id) AND NEW.agency_id IS NOT NULL) THEN
        
        -- Add access rights for the agency owner
        INSERT INTO business_access_rights (business_id, user_id, domain, created_at)
        SELECT 
            NEW.id,           -- business_id from the business_information record
            agencies.owner_id, -- user_id from the agency owner
            NEW.domain,       -- domain from the business_information record
            NEW.created_at    -- created_at from the business_information record
        FROM agencies
        WHERE agencies.id = NEW.agency_id
        ON CONFLICT (business_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_agency_business_access ON business_information;

-- Create the trigger
CREATE TRIGGER ensure_agency_business_access
    AFTER INSERT OR UPDATE OF agency_id ON business_information
    FOR EACH ROW
    EXECUTE FUNCTION sync_agency_business_access();

-- Reset role
RESET ROLE; 