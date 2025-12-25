-- Simplify the signup trigger to reduce latency during auth sign-up.
-- Profile creation is now done client-side via upsert (with RLS insert policy).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm the email (keeps existing behavior)
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = new.id AND email_confirmed_at IS NULL;

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'handle_new_user failed for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
