-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Create a CHECK constraint to ensure settings.onboarding has proper structure when not empty
-- This validates that if onboarding exists in settings, it must have the correct structure
ALTER TABLE public.profiles
ADD CONSTRAINT settings_onboarding_structure_check 
CHECK (
  settings IS NULL 
  OR settings::text = '{}'
  OR (
    settings->'onboarding' IS NOT NULL
    AND settings->'onboarding'->>'intent' IS NOT NULL
    AND settings->'onboarding'->'intent'->>'freelancer' IN ('true', 'false')
    AND settings->'onboarding'->'intent'->>'client' IN ('true', 'false')
    AND settings->'onboarding'->>'completed_at' IS NOT NULL
  )
);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.settings IS 'JSONB field for storing user settings including onboarding data with structure: {"onboarding": {"intent": {"freelancer": bool, "client": bool}, "completed_at": timestamp}}';
COMMENT ON COLUMN public.profiles.has_completed_onboarding IS 'Boolean flag indicating whether user has completed the onboarding flow. Used for routing decisions after authentication.';
