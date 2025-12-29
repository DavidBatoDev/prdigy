-- Add better logging to handle_new_user function for debugging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_created BOOLEAN := FALSE;
  v_wallet_created BOOLEAN := FALSE;
BEGIN
    RAISE LOG 'handle_new_user: Starting for user %', NEW.id;
    
    -- Auto-confirm the email (keeps existing behavior)
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id AND email_confirmed_at IS NULL;
    
    RAISE LOG 'handle_new_user: Email confirmed for user %', NEW.id;

    -- Create a minimal profile row
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    
    -- Check if profile was created
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE id = NEW.id
    ) INTO v_profile_created;
    
    RAISE LOG 'handle_new_user: Profile created=%  for user %', v_profile_created, NEW.id;

    -- Create wallet for the new user
    PERFORM create_wallet_for_user(NEW.id);
    
    -- Check if wallet was created
    SELECT EXISTS(
      SELECT 1 FROM public.wallets WHERE user_id = NEW.id
    ) INTO v_wallet_created;
    
    RAISE LOG 'handle_new_user: Wallet created=% for user %', v_wallet_created, NEW.id;
    
    IF NOT v_profile_created THEN
      RAISE WARNING 'handle_new_user: Profile was not created for user %', NEW.id;
    END IF;
    
    IF NOT v_wallet_created THEN
      RAISE WARNING 'handle_new_user: Wallet was not created for user %', NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'handle_new_user failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user IS 'Trigger function for new user signup: auto-confirms email, creates profile, creates wallet (with enhanced logging)';
