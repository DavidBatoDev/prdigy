-- Add escrow and wallet system with double-entry ledger
-- This migration adds:
-- 1. Wallets table for tracking user balances (available + escrow)
-- 2. Transactions table for complete audit trail
-- 3. Updated payment_status enum for escrow flow
-- 4. Fee configuration columns on projects
-- 5. Functions for atomic escrow operations
-- 6. Admin wallet seeding

-- =======================
-- 1. CREATE NEW ENUM TYPES
-- =======================

-- Transaction types for the ledger
CREATE TYPE transaction_type AS ENUM (
    'deposit',              -- Funds added to platform (future: Stripe/PayPal)
    'withdrawal',           -- Funds removed from platform (future: Stripe/PayPal)
    'escrow_lock',          -- Client funds locked for a milestone
    'escrow_release',       -- Funds released from escrow to payees
    'escrow_refund',        -- Escrowed funds returned to client
    'platform_fee',         -- Platform fee deduction
    'consultant_fee',       -- Consultant management fee
    'freelancer_payout'     -- Payment to freelancer
);

-- =======================
-- 2. UPDATE EXISTING ENUM
-- =======================

-- Expand payment_status for escrow workflow
-- Note: PostgreSQL doesn't support DROP VALUE, so we add new values
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'funded';      -- Client has deposited funds
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'in_escrow';   -- Funds locked in escrow
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'released';    -- Funds distributed to payees
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';    -- Funds returned to client
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'disputed';    -- Payment under dispute

-- =======================
-- 3. CREATE WALLETS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
    escrow_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (escrow_balance >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE wallets IS 'User wallet balances - available funds and escrowed funds';
COMMENT ON COLUMN wallets.available_balance IS 'Funds available for withdrawal or new escrow locks';
COMMENT ON COLUMN wallets.escrow_balance IS 'Funds locked in active projects (not yet released)';
COMMENT ON COLUMN wallets.currency IS 'ISO 4217 currency code (default USD, prepared for multi-currency)';

-- Indexes
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON wallets(user_id);

-- =======================
-- 4. CREATE TRANSACTIONS TABLE (THE LEDGER)
-- =======================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    checkpoint_id UUID REFERENCES payment_checkpoints(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE transactions IS 'Double-entry ledger for all fund movements - immutable audit trail';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount (positive for credits, negative for debits)';
COMMENT ON COLUMN transactions.metadata IS 'Extensible field for future payment gateway IDs (Stripe, PayPal), external references, etc. Example: {"stripe_payment_intent_id": "pi_xxx", "payment_method": "card"}';

-- Indexes
CREATE INDEX IF NOT EXISTS transactions_wallet_id_idx ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS transactions_project_id_idx ON transactions(project_id);
CREATE INDEX IF NOT EXISTS transactions_checkpoint_id_idx ON transactions(checkpoint_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);

-- =======================
-- 5. ADD FEE COLUMNS TO PROJECTS
-- =======================

-- Add configurable fee percentages per project
ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5, 2) DEFAULT 10.00 CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100),
    ADD COLUMN IF NOT EXISTS consultant_fee_percent NUMERIC(5, 2) DEFAULT 15.00 CHECK (consultant_fee_percent >= 0 AND consultant_fee_percent <= 100);

COMMENT ON COLUMN projects.platform_fee_percent IS 'Platform fee percentage (default 10%)';
COMMENT ON COLUMN projects.consultant_fee_percent IS 'Consultant management fee percentage (default 15%)';

-- =======================
-- 6. TRIGGER FOR AUTO-UPDATING UPDATED_AT
-- =======================

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 7. FUNCTION: CREATE WALLET FOR USER
-- =======================

CREATE OR REPLACE FUNCTION create_wallet_for_user(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Check if wallet already exists
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NOT NULL THEN
        RETURN v_wallet_id;
    END IF;
    
    -- Create new wallet
    INSERT INTO wallets (user_id, available_balance, escrow_balance, currency)
    VALUES (p_user_id, 0.00, 0.00, 'USD')
    RETURNING id INTO v_wallet_id;
    
    RETURN v_wallet_id;
END;
$$;

COMMENT ON FUNCTION create_wallet_for_user IS 'Creates a wallet for a user if it does not exist. Returns wallet ID.';

-- =======================
-- 8. FUNCTION: FUND ESCROW (Client locks funds for milestone)
-- =======================

CREATE OR REPLACE FUNCTION fund_escrow(p_checkpoint_id UUID, p_client_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_checkpoint RECORD;
    v_client_wallet RECORD;
    v_amount NUMERIC(12, 2);
    v_result JSONB;
BEGIN
    -- Get checkpoint details
    SELECT * INTO v_checkpoint 
    FROM payment_checkpoints 
    WHERE id = p_checkpoint_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment checkpoint not found';
    END IF;
    
    -- Verify client is the payer
    IF v_checkpoint.payer_id != p_client_user_id THEN
        RAISE EXCEPTION 'User is not the payer for this checkpoint';
    END IF;
    
    -- Check current status
    IF v_checkpoint.status NOT IN ('pending', 'funded') THEN
        RAISE EXCEPTION 'Checkpoint status must be pending or funded (current: %)', v_checkpoint.status;
    END IF;
    
    v_amount := v_checkpoint.amount;
    
    -- Get client wallet
    SELECT * INTO v_client_wallet FROM wallets WHERE user_id = p_client_user_id FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Auto-create wallet if missing
        PERFORM create_wallet_for_user(p_client_user_id);
        SELECT * INTO v_client_wallet FROM wallets WHERE user_id = p_client_user_id FOR UPDATE;
    END IF;
    
    -- Check sufficient available balance
    IF v_client_wallet.available_balance < v_amount THEN
        RAISE EXCEPTION 'Insufficient available balance. Required: %, Available: %', v_amount, v_client_wallet.available_balance;
    END IF;
    
    -- BEGIN TRANSACTION: Move from available to escrow
    
    -- Deduct from available balance (debit)
    UPDATE wallets 
    SET available_balance = available_balance - v_amount,
        escrow_balance = escrow_balance + v_amount,
        updated_at = now()
    WHERE user_id = p_client_user_id;
    
    -- Record transaction (debit from available)
    INSERT INTO transactions (wallet_id, project_id, checkpoint_id, amount, type, description)
    VALUES (
        v_client_wallet.id,
        v_checkpoint.project_id,
        p_checkpoint_id,
        -v_amount,  -- Negative = debit from available
        'escrow_lock',
        'Funds locked in escrow for checkpoint: ' || v_checkpoint.description
    );
    
    -- Update checkpoint status
    UPDATE payment_checkpoints
    SET status = 'in_escrow',
        updated_at = now()
    WHERE id = p_checkpoint_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'checkpoint_id', p_checkpoint_id,
        'amount_locked', v_amount,
        'new_available_balance', (SELECT available_balance FROM wallets WHERE user_id = p_client_user_id),
        'new_escrow_balance', (SELECT escrow_balance FROM wallets WHERE user_id = p_client_user_id)
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Escrow funding failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION fund_escrow IS 'Locks client funds in escrow for a payment checkpoint. Moves funds from available_balance to escrow_balance.';

-- =======================
-- 9. FUNCTION: RELEASE MILESTONE (Cascade split to platform/consultant/freelancer)
-- =======================

CREATE OR REPLACE FUNCTION release_milestone(p_checkpoint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_checkpoint RECORD;
    v_project RECORD;
    v_client_wallet RECORD;
    v_admin_wallet RECORD;
    v_consultant_wallet RECORD;
    v_freelancer_wallet RECORD;
    v_total_amount NUMERIC(12, 2);
    v_platform_fee NUMERIC(12, 2);
    v_consultant_fee NUMERIC(12, 2);
    v_freelancer_amount NUMERIC(12, 2);
    v_admin_user_id UUID;
    v_result JSONB;
BEGIN
    -- Get checkpoint details
    SELECT * INTO v_checkpoint 
    FROM payment_checkpoints 
    WHERE id = p_checkpoint_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment checkpoint not found';
    END IF;
    
    -- Check status
    IF v_checkpoint.status != 'in_escrow' THEN
        RAISE EXCEPTION 'Checkpoint must be in escrow status (current: %)', v_checkpoint.status;
    END IF;
    
    -- Get project with fee configuration
    SELECT * INTO v_project FROM projects WHERE id = v_checkpoint.project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    v_total_amount := v_checkpoint.amount;
    
    -- Calculate splits
    v_platform_fee := ROUND(v_total_amount * (v_project.platform_fee_percent / 100), 2);
    v_consultant_fee := ROUND(v_total_amount * (v_project.consultant_fee_percent / 100), 2);
    v_freelancer_amount := v_total_amount - v_platform_fee - v_consultant_fee;
    
    -- Get admin user (first user with admin persona)
    SELECT id INTO v_admin_user_id 
    FROM profiles 
    WHERE active_persona = 'admin' 
    LIMIT 1;
    
    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found for platform fees';
    END IF;
    
    -- Get/create wallets
    SELECT * INTO v_client_wallet FROM wallets WHERE user_id = v_checkpoint.payer_id FOR UPDATE;
    
    IF NOT FOUND THEN
        PERFORM create_wallet_for_user(v_checkpoint.payer_id);
        SELECT * INTO v_client_wallet FROM wallets WHERE user_id = v_checkpoint.payer_id FOR UPDATE;
    END IF;
    
    -- Check client has sufficient escrow balance
    IF v_client_wallet.escrow_balance < v_total_amount THEN
        RAISE EXCEPTION 'Insufficient escrow balance. Required: %, Escrowed: %', v_total_amount, v_client_wallet.escrow_balance;
    END IF;
    
    -- Get/create admin wallet
    SELECT * INTO v_admin_wallet FROM wallets WHERE user_id = v_admin_user_id FOR UPDATE;
    IF NOT FOUND THEN
        PERFORM create_wallet_for_user(v_admin_user_id);
        SELECT * INTO v_admin_wallet FROM wallets WHERE user_id = v_admin_user_id FOR UPDATE;
    END IF;
    
    -- Get/create consultant wallet (if consultant exists)
    IF v_project.consultant_id IS NOT NULL THEN
        SELECT * INTO v_consultant_wallet FROM wallets WHERE user_id = v_project.consultant_id FOR UPDATE;
        IF NOT FOUND THEN
            PERFORM create_wallet_for_user(v_project.consultant_id);
            SELECT * INTO v_consultant_wallet FROM wallets WHERE user_id = v_project.consultant_id FOR UPDATE;
        END IF;
    END IF;
    
    -- Get/create freelancer wallet
    SELECT * INTO v_freelancer_wallet FROM wallets WHERE user_id = v_checkpoint.payee_id FOR UPDATE;
    IF NOT FOUND THEN
        PERFORM create_wallet_for_user(v_checkpoint.payee_id);
        SELECT * INTO v_freelancer_wallet FROM wallets WHERE user_id = v_checkpoint.payee_id FOR UPDATE;
    END IF;
    
    -- BEGIN CASCADE TRANSACTION
    
    -- 1. Release from client escrow
    UPDATE wallets 
    SET escrow_balance = escrow_balance - v_total_amount,
        updated_at = now()
    WHERE user_id = v_checkpoint.payer_id;
    
    INSERT INTO transactions (wallet_id, project_id, checkpoint_id, amount, type, description)
    VALUES (
        v_client_wallet.id,
        v_checkpoint.project_id,
        p_checkpoint_id,
        -v_total_amount,  -- Negative = released from escrow
        'escrow_release',
        'Escrow released for completed milestone'
    );
    
    -- 2. Platform fee to admin
    UPDATE wallets 
    SET available_balance = available_balance + v_platform_fee,
        updated_at = now()
    WHERE user_id = v_admin_user_id;
    
    INSERT INTO transactions (wallet_id, project_id, checkpoint_id, amount, type, description)
    VALUES (
        v_admin_wallet.id,
        v_checkpoint.project_id,
        p_checkpoint_id,
        v_platform_fee,  -- Positive = credit
        'platform_fee',
        FORMAT('Platform fee (%s%%) for checkpoint', v_project.platform_fee_percent)
    );
    
    -- 3. Consultant fee (if consultant exists)
    IF v_project.consultant_id IS NOT NULL AND v_consultant_fee > 0 THEN
        UPDATE wallets 
        SET available_balance = available_balance + v_consultant_fee,
            updated_at = now()
        WHERE user_id = v_project.consultant_id;
        
        INSERT INTO transactions (wallet_id, project_id, checkpoint_id, amount, type, description)
        VALUES (
            v_consultant_wallet.id,
            v_checkpoint.project_id,
            p_checkpoint_id,
            v_consultant_fee,  -- Positive = credit
            'consultant_fee',
            FORMAT('Consultant management fee (%s%%) for checkpoint', v_project.consultant_fee_percent)
        );
    ELSE
        -- If no consultant, add consultant fee to freelancer payout
        v_freelancer_amount := v_freelancer_amount + v_consultant_fee;
        v_consultant_fee := 0;
    END IF;
    
    -- 4. Freelancer payout
    UPDATE wallets 
    SET available_balance = available_balance + v_freelancer_amount,
        updated_at = now()
    WHERE user_id = v_checkpoint.payee_id;
    
    INSERT INTO transactions (wallet_id, project_id, checkpoint_id, amount, type, description)
    VALUES (
        v_freelancer_wallet.id,
        v_checkpoint.project_id,
        p_checkpoint_id,
        v_freelancer_amount,  -- Positive = credit
        'freelancer_payout',
        'Freelancer payout for completed work'
    );
    
    -- 5. Update checkpoint status
    UPDATE payment_checkpoints
    SET status = 'released',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_checkpoint_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'checkpoint_id', p_checkpoint_id,
        'total_amount', v_total_amount,
        'platform_fee', v_platform_fee,
        'consultant_fee', v_consultant_fee,
        'freelancer_payout', v_freelancer_amount,
        'admin_user_id', v_admin_user_id,
        'consultant_user_id', v_project.consultant_id,
        'freelancer_user_id', v_checkpoint.payee_id
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Milestone release failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION release_milestone IS 'Releases escrowed funds with cascade split: platform fee to admin, consultant fee to consultant, remainder to freelancer. Atomic transaction with full rollback on error.';

-- =======================
-- 10. FUNCTION: REFUND ESCROW (Return funds to client)
-- =======================

CREATE OR REPLACE FUNCTION refund_escrow(p_checkpoint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_checkpoint RECORD;
    v_client_wallet RECORD;
    v_amount NUMERIC(12, 2);
    v_result JSONB;
BEGIN
    -- Get checkpoint details
    SELECT * INTO v_checkpoint 
    FROM payment_checkpoints 
    WHERE id = p_checkpoint_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment checkpoint not found';
    END IF;
    
    -- Check status
    IF v_checkpoint.status != 'in_escrow' THEN
        RAISE EXCEPTION 'Checkpoint must be in escrow status to refund (current: %)', v_checkpoint.status;
    END IF;
    
    v_amount := v_checkpoint.amount;
    
    -- Get client wallet
    SELECT * INTO v_client_wallet FROM wallets WHERE user_id = v_checkpoint.payer_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client wallet not found';
    END IF;
    
    -- Check sufficient escrow balance
    IF v_client_wallet.escrow_balance < v_amount THEN
        RAISE EXCEPTION 'Insufficient escrow balance for refund. Required: %, Escrowed: %', v_amount, v_client_wallet.escrow_balance;
    END IF;
    
    -- BEGIN TRANSACTION: Move from escrow back to available
    
    UPDATE wallets 
    SET escrow_balance = escrow_balance - v_amount,
        available_balance = available_balance + v_amount,
        updated_at = now()
    WHERE user_id = v_checkpoint.payer_id;
    
    -- Record transaction
    INSERT INTO transactions (wallet_id, project_id, checkpoint_id, amount, type, description)
    VALUES (
        v_client_wallet.id,
        v_checkpoint.project_id,
        p_checkpoint_id,
        v_amount,  -- Positive = credit back to available
        'escrow_refund',
        'Escrow refunded to client for checkpoint: ' || v_checkpoint.description
    );
    
    -- Update checkpoint status
    UPDATE payment_checkpoints
    SET status = 'refunded',
        updated_at = now()
    WHERE id = p_checkpoint_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'checkpoint_id', p_checkpoint_id,
        'refunded_amount', v_amount,
        'new_available_balance', (SELECT available_balance FROM wallets WHERE user_id = v_checkpoint.payer_id),
        'new_escrow_balance', (SELECT escrow_balance FROM wallets WHERE user_id = v_checkpoint.payer_id)
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Escrow refund failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION refund_escrow IS 'Refunds escrowed funds back to client. Returns funds from escrow_balance to available_balance.';

-- =======================
-- 11. UPDATE HANDLE_NEW_USER TO CREATE WALLET
-- =======================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Auto-confirm the email (keeps existing behavior)
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id AND email_confirmed_at IS NULL;

    -- Create a minimal profile row
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;

    -- Create wallet for the new user
    PERFORM create_wallet_for_user(NEW.id);

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user IS 'Trigger function for new user signup: auto-confirms email, creates profile, creates wallet';

-- =======================
-- 12. SEED ADMIN WALLET
-- =======================

-- Create admin wallet if admin user exists
-- This will be executed after the migration runs
DO $$
DECLARE
    v_admin_user_id UUID;
    v_wallet_id UUID;
BEGIN
    -- Find first admin user
    SELECT id INTO v_admin_user_id 
    FROM profiles 
    WHERE active_persona = 'admin' 
    LIMIT 1;
    
    -- If admin exists, ensure wallet exists
    IF v_admin_user_id IS NOT NULL THEN
        SELECT create_wallet_for_user(v_admin_user_id) INTO v_wallet_id;
        RAISE NOTICE 'Admin wallet created/verified: %', v_wallet_id;
    ELSE
        RAISE NOTICE 'No admin user found yet. Admin wallet will be created when admin user is created.';
    END IF;
END;
$$;

-- =======================
-- MIGRATION COMPLETE
-- =======================
