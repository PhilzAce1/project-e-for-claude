-- Create seed keyword suggestions table
CREATE TABLE seed_keyword_suggestions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  keyword text NOT NULL,
  section_title text NOT NULL,
  source text NOT NULL DEFAULT 'LLM',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX seed_keyword_suggestions_user_id_idx ON seed_keyword_suggestions(user_id);
CREATE INDEX seed_keyword_suggestions_section_title_idx ON seed_keyword_suggestions(section_title);

-- Add RLS policies
ALTER TABLE seed_keyword_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own seed keyword suggestions
CREATE POLICY "Users can view their own seed keyword suggestions" 
  ON seed_keyword_suggestions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow service role to insert seed keyword suggestions
CREATE POLICY "Service role can insert seed keyword suggestions" 
  ON seed_keyword_suggestions 
  FOR INSERT 
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_seed_keyword_suggestions_updated_at
    BEFORE UPDATE ON seed_keyword_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
