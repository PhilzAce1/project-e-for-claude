-- Add business_id column to content_orders
ALTER TABLE content_orders
ADD COLUMN business_id UUID REFERENCES business_information(id);

-- Update existing content_orders with business_id from user's business
UPDATE content_orders co
SET business_id = bi.id
FROM business_information bi
WHERE bi.user_id = co.user_id;

-- Make business_id required after data migration
ALTER TABLE content_orders
ALTER COLUMN business_id SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_content_orders_business_id ON content_orders(business_id);

-- Update RLS policies
-- DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content_orders;
-- DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON content_orders;
-- DROP POLICY IF EXISTS "Enable update access for authenticated users" ON content_orders;

CREATE POLICY "Enable read access for users with business access" ON content_orders
    FOR SELECT
    USING (business_id IN (
        SELECT business_id 
        FROM business_access_rights 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Enable insert access for users with business access" ON content_orders
    FOR INSERT
    WITH CHECK (business_id IN (
        SELECT business_id 
        FROM business_access_rights 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Enable update access for users with business access" ON content_orders
    FOR UPDATE
    USING (business_id IN (
        SELECT business_id 
        FROM business_access_rights 
        WHERE user_id = auth.uid()
    )); 