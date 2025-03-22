-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Agency owners can view their businesses" ON business_information;

-- Create new policy for agency owners
CREATE POLICY "Agency owners can view their businesses" ON business_information
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT owner_id 
            FROM agencies 
            WHERE id = business_information.agency_id
        )
        OR
        EXISTS (
            SELECT 1 
            FROM business_access_rights 
            WHERE business_access_rights.business_id = business_information.id 
            AND business_access_rights.user_id = auth.uid()
        )
    );

-- Update the trigger to ensure it's working correctly
CREATE OR REPLACE FUNCTION sync_agency_business_access()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id uuid;
BEGIN
    -- Only proceed if agency_id is being set or changed
    IF (TG_OP = 'INSERT' AND NEW.agency_id IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND (OLD.agency_id IS NULL OR OLD.agency_id != NEW.agency_id) AND NEW.agency_id IS NOT NULL) THEN
        
        -- Get the agency owner_id
        SELECT owner_id INTO v_owner_id
        FROM agencies
        WHERE id = NEW.agency_id;

        IF v_owner_id IS NOT NULL THEN
            -- Insert or update access rights
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