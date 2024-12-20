-- Create a function to handle domain analysis
CREATE OR REPLACE FUNCTION public.handle_new_domain()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    log_message TEXT;
BEGIN
    -- Log the initial state
    log_message := format('Trigger called for business_analysis_id=%s, old_domain=%s, new_domain=%s, user_id=%s',
        NEW.id,
        COALESCE(OLD.domain, 'NULL'),
        COALESCE(NEW.domain, 'NULL'),
        COALESCE(NEW.user_id::text, 'NULL')
    );
    RAISE LOG '%', log_message;

    -- Verify we can read from business_analyses
    DECLARE
        analysis_record RECORD;
    BEGIN
        SELECT * INTO analysis_record FROM business_analyses WHERE id = NEW.id;
        IF analysis_record IS NULL THEN
            RAISE LOG 'Could not find business_analysis record with id=%', NEW.id;
        ELSE
            RAISE LOG 'Found business_analysis record: id=%, domain=%, user_id=%',
                analysis_record.id,
                COALESCE(analysis_record.domain, 'NULL'),
                analysis_record.user_id;
        END IF;
    END;

    -- Only trigger when domain changes from null to a value
    IF (OLD.domain IS NULL AND NEW.domain IS NOT NULL) THEN
        RAISE LOG 'Domain changed from NULL to %', NEW.domain;
        
        -- Log the API call attempt
        RAISE LOG 'Attempting API call to %/api/business-information-extraction',
            current_setting('app.settings.base_url');
        
        -- Call the business information extraction API
        PERFORM net.http_post(
          url := 'https://app.espy-go.com/api/business-information-extraction',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'domain', NEW.domain,
                'analysisId', NEW.id,
                'userId', NEW.user_id
            )
        );
        
        RAISE LOG 'API call completed for domain=%', NEW.domain;
    ELSE
        RAISE LOG 'Domain update condition not met: old_domain=%, new_domain=%',
            COALESCE(OLD.domain, 'NULL'),
            COALESCE(NEW.domain, 'NULL');
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_domain: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the trigger
DROP TRIGGER IF EXISTS on_domain_added ON public.business_analyses;

CREATE TRIGGER on_domain_added
    AFTER UPDATE OF domain ON public.business_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_domain();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.handle_new_domain IS 'Triggers business information extraction when domain is added with detailed logging';
