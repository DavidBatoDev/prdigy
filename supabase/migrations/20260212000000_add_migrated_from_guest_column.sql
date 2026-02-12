-- Add column to track which guest profile a user migrated from
-- This helps maintain a relationship between guest accounts and authenticated accounts

-- Add the column (nullable, references profiles table)
ALTER TABLE profiles 
ADD COLUMN migrated_from_guest_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX idx_profiles_migrated_from_guest ON profiles(migrated_from_guest_id) 
WHERE migrated_from_guest_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.migrated_from_guest_id IS 
'UUID of the guest profile this user had before signing up. NULL for users who never used guest mode or for guest users themselves. Should reference a profile where is_guest = TRUE.';
