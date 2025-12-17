-- Update the trigger to auto-confirm email on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function that confirms email and creates profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm the email
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = new.id AND email_confirmed_at IS NULL;
  
  -- Only insert if profile doesn't already exist
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, COALESCE(new.email, new.raw_user_meta_data->>'email', ''))
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
