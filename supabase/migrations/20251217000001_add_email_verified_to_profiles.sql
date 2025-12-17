-- Add email_verified column to profiles table
ALTER TABLE profiles ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to check their email verification status from auth.users
UPDATE profiles p
SET is_email_verified = TRUE
FROM auth.users u
WHERE p.id = u.id AND u.email_confirmed_at IS NOT NULL;
