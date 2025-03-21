-- First become postgres (superuser)
SET ROLE postgres;

-- Make sure service_role has ALL permissions on all relevant tables
GRANT ALL ON business_information TO service_role;
GRANT ALL ON competitors TO service_role;
GRANT ALL ON content_orders TO service_role;
GRANT ALL ON seo_crawls TO service_role;
GRANT ALL ON business_analyses TO service_role;
GRANT ALL ON business_analysis_answers TO service_role;
GRANT ALL ON website_scrapes TO service_role;
GRANT ALL ON business_access_rights TO service_role;

-- Make sure service_role is not restricted by RLS on any table
ALTER TABLE business_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_information NO FORCE ROW LEVEL SECURITY;

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors NO FORCE ROW LEVEL SECURITY;

ALTER TABLE content_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_orders NO FORCE ROW LEVEL SECURITY;

ALTER TABLE seo_crawls ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_crawls NO FORCE ROW LEVEL SECURITY;

ALTER TABLE business_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_analyses NO FORCE ROW LEVEL SECURITY;

ALTER TABLE business_analysis_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_analysis_answers NO FORCE ROW LEVEL SECURITY;

ALTER TABLE website_scrapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_scrapes NO FORCE ROW LEVEL SECURITY;

ALTER TABLE business_access_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_access_rights NO FORCE ROW LEVEL SECURITY;

-- Make sure service_role owns business_access_rights
-- ALTER TABLE business_access_rights OWNER TO service_role;

-- Reset role
RESET ROLE; 