-- Ensure a minimal profile row is created for every new auth user.
-- This avoids relying on the client having an immediately available session.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm the email (keeps existing behavior)
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = new.id AND email_confirmed_at IS NULL;

  -- Create a minimal profile row; client can upsert additional fields later.
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'handle_new_user failed for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
