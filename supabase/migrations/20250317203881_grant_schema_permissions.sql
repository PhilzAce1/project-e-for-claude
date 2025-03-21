-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Grant specific permissions for the view
GRANT ALL ON business_access_rights TO postgres;

-- Grant permissions for the tables
GRANT ALL ON business_information TO postgres;
GRANT ALL ON competitors TO postgres;
GRANT ALL ON content_orders TO postgres;

-- Ensure postgres can manage policies
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres; 