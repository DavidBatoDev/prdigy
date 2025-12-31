-- Add is_user_generated column
ALTER TABLE skills ADD COLUMN is_user_generated BOOLEAN DEFAULT FALSE;
