-- Create a function to handle business analysis updates
CREATE OR REPLACE FUNCTION public.handle_business_analysis_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- Call the edge function with old and new values
    PERFORM net.http_post(
        url := 'https://aryklmppwuliidmvzwpo.supabase.co/functions/v1/business-analysis-change',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
            'old_record', row_to_json(OLD),
            'new_record', row_to_json(NEW),
            'user_id', NEW.user_id
        )
    );
    
    RETURN NEW;
END;
$$;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the trigger
DROP TRIGGER IF EXISTS on_business_analysis_change ON public.business_analyses;

CREATE TRIGGER on_business_analysis_change
    AFTER UPDATE ON public.business_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_business_analysis_change();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO authenticated;
