-- Add skills column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN profiles.skills IS 'Array of skills associated with the consultant profile';
