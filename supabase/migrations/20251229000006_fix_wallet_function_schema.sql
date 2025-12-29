-- Explicitly create the create_wallet_for_user function in public schema
-- Previous attempts may have failed due to schema issues

CREATE OR REPLACE FUNCTION public.create_wallet_for_user(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Check if wallet already exists
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NOT NULL THEN
        RETURN v_wallet_id;
    END IF;
    
    -- Create new wallet with PHP currency (default for this app)
    INSERT INTO public.wallets (user_id, available_balance, escrow_balance, currency)
    VALUES (p_user_id, 0.00, 0.00, 'PHP')
    RETURNING id INTO v_wallet_id;
    
    RETURN v_wallet_id;
END;
$$;

COMMENT ON FUNCTION public.create_wallet_for_user IS 'Creates a wallet for a user if it does not exist. Returns wallet ID.';

-- Verify the function was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'create_wallet_for_user'
    ) THEN
        RAISE NOTICE 'SUCCESS: public.create_wallet_for_user function exists';
    ELSE
        RAISE WARNING 'FAILED: public.create_wallet_for_user function does not exist';
    END IF;
END $$;
