-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their subscriptions" ON subscriptions;

-- Create comprehensive subscription policies
CREATE POLICY "Users can view their subscriptions" ON subscriptions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their subscriptions" ON subscriptions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Make sure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated; 