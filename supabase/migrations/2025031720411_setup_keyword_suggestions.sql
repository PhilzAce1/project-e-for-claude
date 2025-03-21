-- First become postgres (superuser)
SET ROLE postgres;

-- Update keyword_suggestions with business_id from business_information
UPDATE keyword_suggestions ks
SET business_id = bi.id
FROM business_information bi
WHERE ks.user_id = bi.user_id
AND ks.business_id IS NULL;

-- Create trigger to automatically set business_id for new keyword_suggestions
CREATE OR REPLACE FUNCTION set_keyword_suggestion_business_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the business_id from business_information
    SELECT id INTO NEW.business_id
    FROM business_information
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_keyword_suggestion_business_id ON keyword_suggestions;

-- Create the trigger
CREATE TRIGGER ensure_keyword_suggestion_business_id
    BEFORE INSERT ON keyword_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION set_keyword_suggestion_business_id();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for users with business access" ON keyword_suggestions;
DROP POLICY IF EXISTS "Enable insert access for users with business access" ON keyword_suggestions;
DROP POLICY IF EXISTS "Enable update access for users with business access" ON keyword_suggestions;
DROP POLICY IF EXISTS "Enable delete access for users with business access" ON keyword_suggestions;

-- Create policies for keyword_suggestions
CREATE POLICY "Enable read access for users with business access" ON keyword_suggestions
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable insert access for users with business access" ON keyword_suggestions
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable update access for users with business access" ON keyword_suggestions
    FOR UPDATE USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable delete access for users with business access" ON keyword_suggestions
    FOR DELETE USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

-- Make sure RLS is enabled
ALTER TABLE keyword_suggestions ENABLE ROW LEVEL SECURITY;

-- Reset role
RESET ROLE; 