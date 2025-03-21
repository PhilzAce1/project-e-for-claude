-- First become postgres (superuser)
SET ROLE postgres;

-- Drop the existing function WITH CASCADE to handle dependencies
DROP FUNCTION IF EXISTS refresh_business_access_rights() CASCADE;

-- Create function to refresh materialized view with proper return type
CREATE OR REPLACE FUNCTION refresh_business_access_rights()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY business_access_rights;
END;
$$;

-- Grant execution permission to service_role
GRANT EXECUTE ON FUNCTION refresh_business_access_rights() TO service_role;

-- Reset role
RESET ROLE;