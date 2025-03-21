-- First become postgres (superuser)
SET ROLE postgres;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for agency members" ON agencies;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON agencies;
DROP POLICY IF EXISTS "Enable update access for agency owners" ON agencies;
DROP POLICY IF EXISTS "Enable delete access for agency owners" ON agencies;

-- Create policies for agencies
CREATE POLICY "Enable read access for agency members" ON agencies
    FOR SELECT USING (
        -- User is the owner
        owner_id = auth.uid()
        -- Or user has access through business_access_rights to any business in this agency
        OR id IN (
            SELECT agency_id 
            FROM business_information bi
            WHERE bi.agency_id = agencies.id
            AND bi.id IN (
                SELECT business_id 
                FROM business_access_rights 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Enable insert access for authenticated users" ON agencies
    FOR INSERT WITH CHECK (
        -- Only allow setting themselves as owner
        owner_id = auth.uid()
    );

CREATE POLICY "Enable update access for agency owners" ON agencies
    FOR UPDATE USING (
        -- Only agency owner can update
        owner_id = auth.uid()
    );

CREATE POLICY "Enable delete access for agency owners" ON agencies
    FOR DELETE USING (
        -- Only agency owner can delete
        owner_id = auth.uid()
    );

-- Make sure RLS is enabled
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Reset role
RESET ROLE; 