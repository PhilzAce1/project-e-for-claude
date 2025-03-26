-- Enable RLS on products table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for customers" ON customers;
DROP POLICY IF EXISTS "Enable service role access for customers" ON customers;

-- Create read-only access for authenticated users
CREATE POLICY "Enable read access for customers" ON customers
    FOR SELECT
    TO authenticated
    USING (true);

-- Create full access for service role
CREATE POLICY "Enable service role access for customers" ON customers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON customers TO service_role;
GRANT SELECT ON products TO authenticated; 
