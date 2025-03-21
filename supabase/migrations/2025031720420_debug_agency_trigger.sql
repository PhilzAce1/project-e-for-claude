-- First become postgres (superuser)
SET ROLE postgres;

-- Check if trigger exists and drop if it does
SELECT tgname, tgrelid::regclass
FROM pg_trigger 
WHERE tgname = 'ensure_agency_business_access';

-- Drop and recreate with more verbose logging
DROP TRIGGER IF EXISTS ensure_agency_business_access ON business_information;
DROP FUNCTION IF EXISTS sync_agency_business_access();

-- Create function with debug logging
CREATE OR REPLACE FUNCTION sync_agency_business_access()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    -- Add guard against recursive triggers
    IF EXISTS (
        SELECT 1 
        FROM business_access_rights 
        WHERE business_id = NEW.id 
        AND user_id = (SELECT owner_id FROM agencies WHERE id = NEW.agency_id)
    ) THEN
        RAISE NOTICE 'Access rights already exist, skipping to prevent recursion';
        RETURN NEW;
    END IF;

    RAISE NOTICE 'Trigger fired: Operation = %, agency_id = %', TG_OP, NEW.agency_id;
    
    -- If agency_id is being set or changed
    IF (TG_OP = 'INSERT' AND NEW.agency_id IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND (OLD.agency_id IS NULL OR OLD.agency_id != NEW.agency_id) AND NEW.agency_id IS NOT NULL) THEN
        
        RAISE NOTICE 'Condition met: Adding access rights for agency_id = %', NEW.agency_id;
        
        -- Add access rights for the agency owner
        INSERT INTO business_access_rights (business_id, user_id, domain, created_at)
        SELECT 
            NEW.id,
            agencies.owner_id,
            NEW.domain,
            NEW.created_at
        FROM agencies
        WHERE agencies.id = NEW.agency_id
        ON CONFLICT (business_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Access rights added for business_id = %', NEW.id;
    ELSE
        RAISE NOTICE 'Condition not met: No changes needed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER ensure_agency_business_access
    AFTER INSERT OR UPDATE OF agency_id ON business_information
    FOR EACH ROW
    EXECUTE FUNCTION sync_agency_business_access();

-- Reset role
RESET ROLE; 