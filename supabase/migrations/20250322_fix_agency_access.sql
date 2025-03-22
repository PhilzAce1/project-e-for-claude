-- First create a helper function to check agency access
CREATE OR REPLACE FUNCTION check_agency_access(agency_id uuid, user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM agencies 
        WHERE id = agency_id 
        AND owner_id = user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Drop existing agency policies
DROP POLICY IF EXISTS "Agency owners can manage their agency" ON agencies;
DROP POLICY IF EXISTS "Agency owners can view their agency" ON agencies;

-- Create comprehensive agency policies
CREATE POLICY "Agency owners can view their agency" ON agencies
    FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid()
        OR id IN (
            SELECT agency_id 
            FROM business_information 
            WHERE id IN (
                SELECT business_id 
                FROM business_access_rights 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Agency owners can manage their agency" ON agencies
    FOR ALL
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Make sure RLS is enabled
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY; 