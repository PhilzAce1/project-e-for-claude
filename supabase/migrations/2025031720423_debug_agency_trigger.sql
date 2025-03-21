CREATE OR REPLACE FUNCTION sync_agency_business_access()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    RAISE NOTICE 'Trigger fired: Operation = %, agency_id = %, business_id = %', TG_OP, NEW.agency_id, NEW.id;
    
    -- If agency_id is being set or changed
    IF (TG_OP = 'INSERT' AND NEW.agency_id IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND (OLD.agency_id IS NULL OR OLD.agency_id != NEW.agency_id) AND NEW.agency_id IS NOT NULL) THEN
        
        RAISE NOTICE 'Condition met: Adding access rights for agency_id = %', NEW.agency_id;
        
        -- Add access rights for the agency owner with only the fields that exist
        INSERT INTO business_access_rights (
            business_id,
            user_id,
            domain,
            created_at
        )
        SELECT 
            NEW.id,
            agencies.owner_id,
            NEW.domain,
            NOW()
        FROM agencies
        WHERE agencies.id = NEW.agency_id
        ON CONFLICT (business_id, user_id) 
        DO UPDATE SET
            domain = EXCLUDED.domain;
        
        RAISE NOTICE 'Access rights added/updated for business_id = %', NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 