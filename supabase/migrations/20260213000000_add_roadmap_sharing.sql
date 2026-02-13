-- Roadmap Sharing Feature
-- Migration: 20260213000000_add_roadmap_sharing.sql
-- Date: February 13, 2026
-- Description: Adds Google Docs-style sharing for roadmaps with viewer/commenter/editor roles

-- ============================================================================
-- CREATE SHARE ROLE ENUM
-- ============================================================================

CREATE TYPE share_role AS ENUM ('viewer', 'commenter', 'editor');

-- ============================================================================
-- CREATE ROADMAP_SHARES TABLE
-- ============================================================================

CREATE TABLE roadmap_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'base64'),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_emails JSONB DEFAULT '[]'::jsonb, -- Array of {email: string, role: share_role}
  default_role share_role NOT NULL DEFAULT 'viewer', -- Role for public link users
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_roadmap_shares_roadmap_id ON roadmap_shares(roadmap_id);
CREATE INDEX idx_roadmap_shares_share_token ON roadmap_shares(share_token) WHERE is_active = true;
CREATE INDEX idx_roadmap_shares_invited_emails ON roadmap_shares USING gin(invited_emails);

-- Ensure only one active share per roadmap
CREATE UNIQUE INDEX idx_roadmap_shares_unique_active ON roadmap_shares(roadmap_id) WHERE is_active = true;

-- Restrict public link default_role to viewer or commenter only (no editor access)
ALTER TABLE roadmap_shares ADD CONSTRAINT check_default_role_not_editor 
  CHECK (default_role IN ('viewer', 'commenter'));

-- ============================================================================
-- CREATE COMMENT TABLES
-- ============================================================================

-- Epic comments
CREATE TABLE epic_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epic_id UUID NOT NULL REFERENCES roadmap_epics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_epic_comments_epic_id ON epic_comments(epic_id);
CREATE INDEX idx_epic_comments_user_id ON epic_comments(user_id);

-- Feature comments
CREATE TABLE feature_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES roadmap_features(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_comments_feature_id ON feature_comments(feature_id);
CREATE INDEX idx_feature_comments_user_id ON feature_comments(user_id);

-- ============================================================================
-- CREATE HELPER FUNCTION FOR SHARE ROLE
-- ============================================================================

-- Get user's effective role for a roadmap (owner > editor > commenter > viewer)
CREATE OR REPLACE FUNCTION get_user_roadmap_share_role(p_roadmap_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_owner_id UUID;
  v_project_id UUID;
  v_user_email TEXT;
  v_share_record RECORD;
  v_invited_user JSONB;
  v_role TEXT;
BEGIN
  -- Get roadmap details
  SELECT owner_id, project_id INTO v_owner_id, v_project_id
  FROM roadmaps
  WHERE id = p_roadmap_id;
  
  -- If user is owner, return 'owner'
  IF v_owner_id = p_user_id THEN
    RETURN 'owner';
  END IF;
  
  -- If roadmap has a project and user is a member, return 'editor'
  IF v_project_id IS NOT NULL AND is_project_member(v_project_id, p_user_id) THEN
    RETURN 'editor';
  END IF;
  
  -- Get user's email for invited email matching
  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check active share configuration
  SELECT * INTO v_share_record
  FROM roadmap_shares
  WHERE roadmap_id = p_roadmap_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  -- If no active share, no access
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Check if user's email is in invited_emails array
  IF v_user_email IS NOT NULL THEN
    FOR v_invited_user IN 
      SELECT * FROM jsonb_array_elements(v_share_record.invited_emails)
    LOOP
      IF (v_invited_user->>'email')::text = v_user_email THEN
        RETURN (v_invited_user->>'role')::text;
      END IF;
    END LOOP;
  END IF;
  
  -- Return NULL (user needs to use public share link)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user has at least a certain role
CREATE OR REPLACE FUNCTION has_roadmap_permission(p_roadmap_id UUID, p_user_id UUID, p_required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  v_user_role := get_user_roadmap_share_role(p_roadmap_id, p_user_id);
  
  -- Role hierarchy: owner > editor > commenter > viewer
  RETURN CASE p_required_role
    WHEN 'viewer' THEN v_user_role IN ('owner', 'editor', 'commenter', 'viewer')
    WHEN 'commenter' THEN v_user_role IN ('owner', 'editor', 'commenter')
    WHEN 'editor' THEN v_user_role IN ('owner', 'editor')
    WHEN 'owner' THEN v_user_role = 'owner'
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- UPDATE EXISTING RLS POLICIES FOR ROADMAPS
-- ============================================================================

-- Drop and recreate roadmaps policies with sharing support
DROP POLICY IF EXISTS roadmaps_select ON roadmaps;
DROP POLICY IF EXISTS roadmaps_insert ON roadmaps;
DROP POLICY IF EXISTS roadmaps_update ON roadmaps;
DROP POLICY IF EXISTS roadmaps_delete ON roadmaps;

-- SELECT: Owner OR project member OR shared user (any role)
CREATE POLICY roadmaps_select ON roadmaps
  FOR SELECT USING (
    owner_id = auth.uid() OR
    (project_id IS NOT NULL AND is_project_member(project_id, auth.uid())) OR
    get_user_roadmap_share_role(id, auth.uid()) IS NOT NULL
  );

-- INSERT: Unchanged - only authenticated users can create roadmaps they own
CREATE POLICY roadmaps_insert ON roadmaps
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND
    (
      (project_id IS NULL AND status = 'draft') OR
      (project_id IS NOT NULL AND (
        EXISTS (
          SELECT 1 FROM projects 
          WHERE id = project_id 
          AND (client_id = auth.uid() OR consultant_id = auth.uid())
        )
      ))
    )
  );

-- UPDATE: Owner OR project consultant OR shared user with editor role
CREATE POLICY roadmaps_update ON roadmaps
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND consultant_id = auth.uid()
    )) OR
    has_roadmap_permission(id, auth.uid(), 'editor')
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND consultant_id = auth.uid()
    )) OR
    has_roadmap_permission(id, auth.uid(), 'editor')
  );

-- DELETE: Only owner can delete
CREATE POLICY roadmaps_delete ON roadmaps
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- UPDATE CAN_ACCESS_ROADMAP HELPER FUNCTION
-- ============================================================================

-- Update existing helper to include share role check
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
  
  -- If roadmap is owned by the user, allow access
  IF v_owner_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- If roadmap has a project, check project membership
  IF v_project_id IS NOT NULL AND is_project_member(v_project_id, p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has share access
  IF get_user_roadmap_share_role(p_roadmap_id, p_user_id) IS NOT NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise deny access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper for write access (editor role required)
CREATE OR REPLACE FUNCTION can_edit_roadmap(p_roadmap_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_project_id UUID;
  v_owner_id UUID;
BEGIN
  -- Get roadmap details
  SELECT project_id, owner_id INTO v_project_id, v_owner_id
  FROM roadmaps
  WHERE id = p_roadmap_id;
  
  -- If roadmap is owned by the user, allow editing
  IF v_owner_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- If roadmap has a project, check project membership
  IF v_project_id IS NOT NULL AND is_project_member(v_project_id, p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has editor role via sharing
  IF has_roadmap_permission(p_roadmap_id, p_user_id, 'editor') THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- UPDATE RLS POLICIES FOR CHILD TABLES (MILESTONES, EPICS, FEATURES, TASKS)
-- ============================================================================

-- Milestones: Update policies to use new helper
DROP POLICY IF EXISTS roadmap_milestones_insert ON roadmap_milestones;
DROP POLICY IF EXISTS roadmap_milestones_update ON roadmap_milestones;
DROP POLICY IF EXISTS roadmap_milestones_delete ON roadmap_milestones;

CREATE POLICY roadmap_milestones_insert ON roadmap_milestones
  FOR INSERT WITH CHECK (can_edit_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_milestones_update ON roadmap_milestones
  FOR UPDATE USING (can_edit_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_milestones_delete ON roadmap_milestones
  FOR DELETE USING (can_edit_roadmap(roadmap_id, auth.uid()));

-- Epics: Update policies to use new helper
DROP POLICY IF EXISTS roadmap_epics_insert ON roadmap_epics;
DROP POLICY IF EXISTS roadmap_epics_update ON roadmap_epics;
DROP POLICY IF EXISTS roadmap_epics_delete ON roadmap_epics;

CREATE POLICY roadmap_epics_insert ON roadmap_epics
  FOR INSERT WITH CHECK (can_edit_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_epics_update ON roadmap_epics
  FOR UPDATE USING (can_edit_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_epics_delete ON roadmap_epics
  FOR DELETE USING (can_edit_roadmap(roadmap_id, auth.uid()));

-- Features: Update policies (check via roadmap_id for v2.0 schema)
DROP POLICY IF EXISTS roadmap_features_insert ON roadmap_features;
DROP POLICY IF EXISTS roadmap_features_update ON roadmap_features;
DROP POLICY IF EXISTS roadmap_features_delete ON roadmap_features;

CREATE POLICY roadmap_features_insert ON roadmap_features
  FOR INSERT WITH CHECK (can_edit_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_features_update ON roadmap_features
  FOR UPDATE USING (can_edit_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_features_delete ON roadmap_features
  FOR DELETE USING (can_edit_roadmap(roadmap_id, auth.uid()));

-- Tasks: Update policies to use new helper
DROP POLICY IF EXISTS roadmap_tasks_insert ON roadmap_tasks;
DROP POLICY IF EXISTS roadmap_tasks_update ON roadmap_tasks;
DROP POLICY IF EXISTS roadmap_tasks_delete ON roadmap_tasks;

CREATE POLICY roadmap_tasks_insert ON roadmap_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM roadmap_features f
      WHERE f.id = feature_id
      AND can_edit_roadmap(f.roadmap_id, auth.uid())
    )
  );

CREATE POLICY roadmap_tasks_update ON roadmap_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM roadmap_features f
      WHERE f.id = feature_id
      AND can_edit_roadmap(f.roadmap_id, auth.uid())
    )
  );

CREATE POLICY roadmap_tasks_delete ON roadmap_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM roadmap_features f
      WHERE f.id = feature_id
      AND can_edit_roadmap(f.roadmap_id, auth.uid())
    )
  );

-- ============================================================================
-- ADD RLS POLICIES FOR ROADMAP_SHARES TABLE
-- ============================================================================

ALTER TABLE roadmap_shares ENABLE ROW LEVEL SECURITY;

-- SELECT: Roadmap owner can view share settings
CREATE POLICY roadmap_shares_select ON roadmap_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmaps
      WHERE id = roadmap_id AND owner_id = auth.uid()
    )
  );

-- INSERT: Roadmap owner can create shares
CREATE POLICY roadmap_shares_insert ON roadmap_shares
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM roadmaps
      WHERE id = roadmap_id AND owner_id = auth.uid()
    )
  );

-- UPDATE: Roadmap owner can update shares
CREATE POLICY roadmap_shares_update ON roadmap_shares
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM roadmaps
      WHERE id = roadmap_id AND owner_id = auth.uid()
    )
  );

-- DELETE: Roadmap owner can delete shares
CREATE POLICY roadmap_shares_delete ON roadmap_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM roadmaps
      WHERE id = roadmap_id AND owner_id = auth.uid()
    )
  );

-- ============================================================================
-- ADD RLS POLICIES FOR COMMENT TABLES
-- ============================================================================

ALTER TABLE epic_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_comments ENABLE ROW LEVEL SECURITY;

-- Epic Comments Policies
CREATE POLICY epic_comments_select ON epic_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap_epics e
      WHERE e.id = epic_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

CREATE POLICY epic_comments_insert ON epic_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM roadmap_epics e
      WHERE e.id = epic_id
      AND has_roadmap_permission(e.roadmap_id, auth.uid(), 'commenter')
    )
  );

CREATE POLICY epic_comments_update ON epic_comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY epic_comments_delete ON epic_comments
  FOR DELETE USING (user_id = auth.uid());

-- Feature Comments Policies
CREATE POLICY feature_comments_select ON feature_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap_features f
      WHERE f.id = feature_id
      AND can_access_roadmap(f.roadmap_id, auth.uid())
    )
  );

CREATE POLICY feature_comments_insert ON feature_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM roadmap_features f
      WHERE f.id = feature_id
      AND has_roadmap_permission(f.roadmap_id, auth.uid(), 'commenter')
    )
  );

CREATE POLICY feature_comments_update ON feature_comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY feature_comments_delete ON feature_comments
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- ADD UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for roadmap_shares
CREATE TRIGGER update_roadmap_shares_updated_at
  BEFORE UPDATE ON roadmap_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for epic_comments
CREATE TRIGGER update_epic_comments_updated_at
  BEFORE UPDATE ON epic_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for feature_comments
CREATE TRIGGER update_feature_comments_updated_at
  BEFORE UPDATE ON feature_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE roadmap_shares IS 'Stores sharing configuration for roadmaps with token-based and email-based access';
COMMENT ON COLUMN roadmap_shares.share_token IS 'Unique token for public link sharing';
COMMENT ON COLUMN roadmap_shares.invited_emails IS 'JSONB array of {email: string, role: share_role} for user-specific invitations';
COMMENT ON COLUMN roadmap_shares.default_role IS 'Default access role for users accessing via public link';

COMMENT ON TABLE epic_comments IS 'User comments on roadmap epics';
COMMENT ON TABLE feature_comments IS 'User comments on roadmap features';

COMMENT ON FUNCTION get_user_roadmap_share_role IS 'Returns user''s effective role for a roadmap: owner, editor, commenter, viewer, or NULL';
COMMENT ON FUNCTION has_roadmap_permission IS 'Checks if user has at least the specified permission level for a roadmap';
COMMENT ON FUNCTION can_edit_roadmap IS 'Checks if user can edit roadmap (owner, project member, or editor role)';
