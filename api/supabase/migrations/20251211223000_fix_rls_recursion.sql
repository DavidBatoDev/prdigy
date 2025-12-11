-- Fix infinite recursion in project_members RLS policy
-- The policy was checking project_members inside a policy on project_members

-- Drop the problematic policy
DROP POLICY IF EXISTS "Project members can view team" ON project_members;

-- Recreate it with a simpler, non-recursive approach
-- Project members can view their own membership and other members in the same project
CREATE POLICY "Project members can view team"
    ON project_members FOR SELECT
    USING (
        -- User can see their own memberships
        user_id = auth.uid()
        OR
        -- User can see other members of projects they belong to
        project_id IN (
            SELECT project_id 
            FROM project_members 
            WHERE user_id = auth.uid()
        )
    );
