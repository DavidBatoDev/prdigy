-- Create wallets for existing users who don't have one
-- This fixes users created before the wallet function was working

DO $$
DECLARE
    v_user RECORD;
    v_wallet_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Loop through all users who have profiles but no wallets
    FOR v_user IN 
        SELECT p.id, p.email
        FROM public.profiles p
        LEFT JOIN public.wallets w ON p.id = w.user_id
        WHERE w.id IS NULL
    LOOP
        -- Create wallet for this user
        INSERT INTO public.wallets (user_id, available_balance, escrow_balance, currency)
        VALUES (v_user.id, 0.00, 0.00, 'PHP')
        RETURNING id INTO v_wallet_id;
        
        v_count := v_count + 1;
        RAISE NOTICE 'Created wallet % for user % (%)', v_wallet_id, v_user.id, v_user.email;
    END LOOP;
    
    RAISE NOTICE 'Total wallets created: %', v_count;
END $$;
