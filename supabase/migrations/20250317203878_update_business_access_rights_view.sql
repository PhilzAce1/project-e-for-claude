

CREATE POLICY "Enable insert access for users with business or agency access" ON business_information
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
