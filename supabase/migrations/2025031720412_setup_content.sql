-- First become postgres (superuser)
SET ROLE postgres;

-- Add business_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content' 
        AND column_name = 'business_id'
    ) THEN
        ALTER TABLE content 
        ADD COLUMN business_id UUID REFERENCES business_information(id);
    END IF;
END $$;

-- Create index on business_id
CREATE INDEX IF NOT EXISTS content_business_id_idx ON content(business_id);

-- Update content with business_id from business_information
UPDATE content c
SET business_id = bi.id
FROM business_information bi
WHERE c.user_id = bi.user_id
AND c.business_id IS NULL;

-- Create trigger to automatically set business_id for new content
CREATE OR REPLACE FUNCTION set_content_business_id()
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
DROP TRIGGER IF EXISTS ensure_content_business_id ON content;

-- Create the trigger
CREATE TRIGGER ensure_content_business_id
    BEFORE INSERT ON content
    FOR EACH ROW
    EXECUTE FUNCTION set_content_business_id();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for users with business access" ON content;
DROP POLICY IF EXISTS "Enable insert access for users with business access" ON content;
DROP POLICY IF EXISTS "Enable update access for users with business access" ON content;
DROP POLICY IF EXISTS "Enable delete access for users with business access" ON content;

-- Create policies for content
CREATE POLICY "Enable read access for users with business access" ON content
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable insert access for users with business access" ON content
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable update access for users with business access" ON content
    FOR UPDATE USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Enable delete access for users with business access" ON content
    FOR DELETE USING (
        business_id IN (SELECT business_id FROM business_access_rights WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

-- Make sure RLS is enabled
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Reset role
RESET ROLE; 