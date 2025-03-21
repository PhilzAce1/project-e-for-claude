-- First become postgres (superuser)
SET ROLE postgres;

-- Update content_recommendations with business_id from business_information
UPDATE content_recommendations cr
SET business_id = bi.id
FROM business_information bi
WHERE cr.user_id = bi.user_id
AND cr.business_id IS NULL;

-- Create trigger to automatically set business_id for new content_recommendations
CREATE OR REPLACE FUNCTION set_content_recommendation_business_id()
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
DROP TRIGGER IF EXISTS ensure_content_recommendation_business_id ON content_recommendations;

-- Create the trigger
CREATE TRIGGER ensure_content_recommendation_business_id
    BEFORE INSERT ON content_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION set_content_recommendation_business_id();

-- Reset role
RESET ROLE; 