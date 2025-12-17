-- Add optional profile fields
ALTER TABLE profiles ADD COLUMN gender TEXT;
ALTER TABLE profiles ADD COLUMN phone_number TEXT;
ALTER TABLE profiles ADD COLUMN country TEXT;
ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN city TEXT;
ALTER TABLE profiles ADD COLUMN zip_code TEXT;
