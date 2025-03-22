-- First create a helper function that will check access
CREATE OR REPLACE FUNCTION check_business_access(business_id uuid, user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM business_access_rights 
        WHERE business_access_rights.business_id = $1 
        AND business_access_rights.user_id = $2
    );
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies
DROP POLICY IF EXISTS "Agency owners can view their businesses" ON business_information;

-- Create new policy using the helper function
CREATE POLICY "Agency owners can view their businesses" ON business_information
    FOR SELECT
    TO authenticated
    USING (
        check_business_access(id, auth.uid())
    );

-- Keep the trigger
CREATE OR REPLACE FUNCTION sync_agency_business_access()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_id uuid;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.agency_id IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND (OLD.agency_id IS NULL OR OLD.agency_id != NEW.agency_id) AND NEW.agency_id IS NOT NULL) THEN
        
        SELECT owner_id INTO v_owner_id
        FROM agencies
        WHERE id = NEW.agency_id;

        IF v_owner_id IS NOT NULL THEN
            INSERT INTO business_access_rights (
                business_id,
                user_id,
                domain,
                created_at
            )
            VALUES (
                NEW.id,
                v_owner_id,
                NEW.domain,
                NOW()
            )
            ON CONFLICT (business_id, user_id) 
            DO UPDATE SET 
                domain = EXCLUDED.domain;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 