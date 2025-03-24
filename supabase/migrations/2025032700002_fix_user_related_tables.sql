-- Users table policies (with explicit schema)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can manage their own data" ON public.users
    FOR ALL
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Make sure RLS is enabled on all tables (with explicit schema where needed)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions (with explicit schema where needed)
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
