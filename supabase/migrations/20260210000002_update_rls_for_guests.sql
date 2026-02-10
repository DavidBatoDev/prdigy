-- Update RLS Policies for Guest User Support
-- Migration: 20260210000002_update_rls_for_guests.sql
-- Date: February 10, 2026
-- Description: Updates RLS policies to allow guest users to access their own draft roadmaps

-- ============================================================================
-- UPDATE HELPER FUNCTIONS
-- ============================================================================

-- Update can_access_roadmap to support guest users accessing their own drafts
CREATE OR REPLACE FUNCTION can_access_roadmap(p_roadmap_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_project_id UUID;
  v_owner_id UUID;
BEGIN
  -- Get roadmap details
  SELECT project_id, owner_id INTO v_project_id, v_owner_id
  FROM roadmaps
  WHERE id = p_roadmap_id;
  
  -- If roadmap is owned by the user (includes guest users), allow access
  IF v_owner_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- If roadmap has a project, check project membership
  IF v_project_id IS NOT NULL THEN
    RETURN is_project_member(v_project_id, p_user_id);
  END IF;
  
  -- Otherwise deny access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- UPDATE ROADMAPS POLICIES
-- ============================================================================

-- Drop existing roadmaps policies
DROP POLICY IF EXISTS roadmaps_select ON roadmaps;
DROP POLICY IF EXISTS roadmaps_insert ON roadmaps;
DROP POLICY IF EXISTS roadmaps_update ON roadmaps;
DROP POLICY IF EXISTS roadmaps_delete ON roadmaps;

-- SELECT: Owner can view their own roadmaps, or project members can view project roadmaps
CREATE POLICY roadmaps_select ON roadmaps
  FOR SELECT USING (
    owner_id = auth.uid() OR
    (project_id IS NOT NULL AND is_project_member(project_id, auth.uid()))
  );

-- INSERT: Authenticated users can create roadmaps they own
-- For draft roadmaps: project_id can be NULL
-- For project roadmaps: must be project member
CREATE POLICY roadmaps_insert ON roadmaps
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND
    (
      -- Draft roadmaps without project
      (project_id IS NULL AND status = 'draft') OR
      -- Roadmaps with project (must be project member)
      (project_id IS NOT NULL AND (
        EXISTS (
          SELECT 1 FROM projects 
          WHERE id = project_id 
          AND (client_id = auth.uid() OR consultant_id = auth.uid())
        )
      ))
    )
  );

-- UPDATE: Owner can update their own roadmaps, or project consultant can update
-- Guest users can only update their own draft roadmaps
CREATE POLICY roadmaps_update ON roadmaps
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND consultant_id = auth.uid()
    ))
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND consultant_id = auth.uid()
    ))
  );

-- DELETE: Only owner can delete their own roadmaps
CREATE POLICY roadmaps_delete ON roadmaps
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- ADD GUEST USER CONSTRAINT TO UPDATES
-- ============================================================================

-- Prevent guest users from changing certain fields
-- This is enforced at application level but adding a check here for safety
CREATE OR REPLACE FUNCTION prevent_guest_status_change()
RETURNS TRIGGER AS $$
DECLARE
  guest_flag BOOLEAN;
BEGIN
  -- Check if the owner is a guest user
  SELECT is_guest INTO guest_flag
  FROM profiles
  WHERE id = NEW.owner_id;
  
  -- If guest user, prevent changing status from 'draft'
  IF guest_flag = TRUE AND OLD.status = 'draft' AND NEW.status != 'draft' THEN
    RAISE EXCEPTION 'Guest users cannot change roadmap status from draft';
  END IF;
  
  -- If guest user, prevent adding to project (should happen via migration)
  IF guest_flag = TRUE AND OLD.project_id IS NULL AND NEW.project_id IS NOT NULL THEN
    RAISE EXCEPTION 'Guest roadmaps must be migrated through signup process';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce guest restrictions
CREATE TRIGGER enforce_guest_roadmap_restrictions
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION prevent_guest_status_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION can_access_roadmap IS 
  'Updated to support guest users accessing their own draft roadmaps without project membership';

COMMENT ON FUNCTION prevent_guest_status_change IS 
  'Prevents guest users from changing roadmap status or linking to projects directly (must migrate through signup)';
