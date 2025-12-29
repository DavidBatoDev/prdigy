-- Recreate the create_wallet_for_user function
-- This fixes the issue where the function wasn't created on the remote database

CREATE OR REPLACE FUNCTION public.create_wallet_for_user(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
