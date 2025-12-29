-- RLS Policies for Wallets and Transactions
-- This migration adds Row Level Security policies for the escrow system

-- =======================
-- 1. ENABLE RLS ON TABLES
-- =======================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- =======================
-- 2. WALLETS POLICIES
-- =======================

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet"
    ON wallets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role (backend) can view all wallets
-- Note: service_role bypasses RLS by default, but this documents intent

-- No INSERT/UPDATE/DELETE policies for users
-- All wallet modifications must go through SECURITY DEFINER functions

-- =======================
-- 3. TRANSACTIONS POLICIES
-- =======================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON transactions
    FOR SELECT
    USING (
        wallet_id IN (
            SELECT id FROM wallets WHERE user_id = auth.uid()
        )
    );

-- Users can view transactions for projects they're members of
CREATE POLICY "Users can view project transactions"
    ON transactions
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id 
            FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

-- No INSERT/UPDATE/DELETE policies for users
-- All transaction records are created by SECURITY DEFINER functions

-- =======================
-- POLICIES COMPLETE
-- =======================
