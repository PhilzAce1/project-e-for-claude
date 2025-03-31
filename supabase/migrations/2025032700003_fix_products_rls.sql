-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for products" ON products;
DROP POLICY IF EXISTS "Enable service role access for products" ON products;

-- Create read-only access for authenticated users
CREATE POLICY "Enable read access for products" ON products
    FOR SELECT
    TO authenticated
    USING (true);

-- Create full access for service role
CREATE POLICY "Enable service role access for products" ON products
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON products TO service_role;
GRANT SELECT ON products TO authenticated; 