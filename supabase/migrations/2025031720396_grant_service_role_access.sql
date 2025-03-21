-- First become postgres (superuser)
SET ROLE postgres;

-- Grant ALL permissions to service_role for each table
GRANT ALL ON business_information TO service_role;
GRANT ALL ON competitors TO service_role;
GRANT ALL ON content_orders TO service_role;
GRANT ALL ON seo_crawls TO service_role;
GRANT ALL ON business_analyses TO service_role;
GRANT ALL ON business_analysis_answers TO service_role;
GRANT ALL ON website_scrapes TO service_role;
GRANT ALL ON business_access_rights TO service_role;

-- Grant ALL permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Disable RLS for service_role on all tables
ALTER TABLE business_information FORCE ROW LEVEL SECURITY;
ALTER TABLE business_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_information NO FORCE ROW LEVEL SECURITY;

ALTER TABLE competitors FORCE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors NO FORCE ROW LEVEL SECURITY;

ALTER TABLE content_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE content_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_orders NO FORCE ROW LEVEL SECURITY;

ALTER TABLE seo_crawls FORCE ROW LEVEL SECURITY;
ALTER TABLE seo_crawls ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_crawls NO FORCE ROW LEVEL SECURITY;

ALTER TABLE business_analyses FORCE ROW LEVEL SECURITY;
ALTER TABLE business_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_analyses NO FORCE ROW LEVEL SECURITY;

ALTER TABLE business_analysis_answers FORCE ROW LEVEL SECURITY;
ALTER TABLE business_analysis_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_analysis_answers NO FORCE ROW LEVEL SECURITY;

ALTER TABLE website_scrapes FORCE ROW LEVEL SECURITY;
ALTER TABLE website_scrapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scrapes NO FORCE ROW LEVEL SECURITY;

ALTER TABLE business_access_rights FORCE ROW LEVEL SECURITY;
ALTER TABLE business_access_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_access_rights NO FORCE ROW LEVEL SECURITY;

-- Reset role
RESET ROLE; 