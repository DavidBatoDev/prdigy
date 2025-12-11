-- Fix all RLS infinite recursion issues
-- The main issue is policies on profiles referencing project_members
-- which then references profiles, creating circular dependency

-- Drop the problematic profile policy
DROP POLICY IF EXISTS "Users can view teammate profiles" ON profiles;

-- For now, keep profile policies simple - users can only view their own profile
-- Later we can add teammate viewing through the API layer instead of RLS

-- This ensures the profiles table can be queried without recursion
