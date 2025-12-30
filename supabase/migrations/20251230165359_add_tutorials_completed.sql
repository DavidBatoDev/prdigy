-- Add tutorials_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN tutorials_completed JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.tutorials_completed IS 'JSONB field for storing completed tutorials. Structure: {"tutorial_name": {"completed_at": timestamp, "data": any}}';
