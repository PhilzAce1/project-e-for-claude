-- First become postgres (superuser)
SET ROLE postgres;

-- Drop the view
DROP VIEW IF EXISTS business_access_rights CASCADE;

-- Create as table
CREATE TABLE business_access_rights (
    business_id UUID NOT NULL,
    user_id UUID NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ,
    PRIMARY KEY (business_id, user_id)
);

-- Populate initial data
INSERT INTO business_access_rights
SELECT DISTINCT
    bi.id as business_id,
    bi.user_id,
    bi.domain,
    bi.created_at
FROM business_information bi
WHERE bi.id IS NOT NULL
AND bi.user_id IS NOT NULL;

-- Create function to maintain the table
CREATE OR REPLACE FUNCTION update_business_access_rights()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO business_access_rights (business_id, user_id, domain, created_at)
        VALUES (NEW.id, NEW.user_id, NEW.domain, NEW.created_at)
        ON CONFLICT (business_id, user_id) DO NOTHING;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE business_access_rights
        SET domain = NEW.domain
        WHERE business_id = NEW.id AND user_id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM business_access_rights
        WHERE business_id = OLD.id AND user_id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER business_information_insert_trigger
    AFTER INSERT ON business_information
    FOR EACH ROW
    EXECUTE FUNCTION update_business_access_rights();

CREATE TRIGGER business_information_update_trigger
    AFTER UPDATE ON business_information
    FOR EACH ROW
    EXECUTE FUNCTION update_business_access_rights();

CREATE TRIGGER business_information_delete_trigger
    AFTER DELETE ON business_information
    FOR EACH ROW
    EXECUTE FUNCTION update_business_access_rights();

-- Grant permissions
GRANT ALL ON business_access_rights TO service_role;
GRANT SELECT ON business_access_rights TO authenticated;
GRANT SELECT ON business_access_rights TO anon;

-- Enable RLS
ALTER TABLE business_access_rights ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Enable read access for all" ON business_access_rights
    FOR SELECT USING (true);

-- Reset role
RESET ROLE; 