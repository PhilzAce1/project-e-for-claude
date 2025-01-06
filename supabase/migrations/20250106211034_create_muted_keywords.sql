-- Create the muted_keywords table
CREATE TABLE IF NOT EXISTS muted_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    UNIQUE(user_id, keyword)
);

-- Enable RLS
ALTER TABLE muted_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own muted keywords"
    ON muted_keywords
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own muted keywords"
    ON muted_keywords
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own muted keywords"
    ON muted_keywords
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_muted_keywords_user_id ON muted_keywords(user_id);
CREATE INDEX idx_muted_keywords_keyword ON muted_keywords(keyword);
