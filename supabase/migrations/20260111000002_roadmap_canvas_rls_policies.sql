-- Roadmap Canvas RLS Policies
-- Migration: 20260111000002_roadmap_canvas_rls_policies.sql
-- Date: January 11, 2026
-- Description: Row Level Security policies for roadmap canvas tables

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROADMAPS POLICIES
-- ============================================================================

-- SELECT: Project members can view roadmaps
CREATE POLICY roadmaps_select ON roadmaps
  FOR SELECT USING (
    is_project_member(project_id, auth.uid())
  );

-- INSERT: Project owner or consultant can create roadmaps
CREATE POLICY roadmaps_insert ON roadmaps
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND (client_id = auth.uid() OR consultant_id = auth.uid())
    )
  );

-- UPDATE: Roadmap owner or project consultant can update
CREATE POLICY roadmaps_update ON roadmaps
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND consultant_id = auth.uid()
    )
  );

-- DELETE: Only roadmap owner can delete
CREATE POLICY roadmaps_delete ON roadmaps
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- ROADMAP MILESTONES POLICIES
-- ============================================================================

-- All operations: Project members can manage milestones via roadmap access
CREATE POLICY roadmap_milestones_select ON roadmap_milestones
  FOR SELECT USING (can_access_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_milestones_insert ON roadmap_milestones
  FOR INSERT WITH CHECK (can_access_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_milestones_update ON roadmap_milestones
  FOR UPDATE USING (can_access_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_milestones_delete ON roadmap_milestones
  FOR DELETE USING (can_access_roadmap(roadmap_id, auth.uid()));

-- ============================================================================
-- ROADMAP EPICS POLICIES
-- ============================================================================

-- All operations: Project members can manage epics via roadmap access
CREATE POLICY roadmap_epics_select ON roadmap_epics
  FOR SELECT USING (can_access_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_epics_insert ON roadmap_epics
  FOR INSERT WITH CHECK (can_access_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_epics_update ON roadmap_epics
  FOR UPDATE USING (can_access_roadmap(roadmap_id, auth.uid()));

CREATE POLICY roadmap_epics_delete ON roadmap_epics
  FOR DELETE USING (can_access_roadmap(roadmap_id, auth.uid()));

-- ============================================================================
-- MILESTONE EPICS JUNCTION POLICIES
-- ============================================================================

-- All operations: Project members can manage epic-milestone links
CREATE POLICY milestone_epics_select ON milestone_epics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap_milestones m
      WHERE m.id = milestone_id
      AND can_access_roadmap(m.roadmap_id, auth.uid())
    )
  );

CREATE POLICY milestone_epics_insert ON milestone_epics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM roadmap_milestones m
      WHERE m.id = milestone_id
      AND can_access_roadmap(m.roadmap_id, auth.uid())
    )
  );

CREATE POLICY milestone_epics_update ON milestone_epics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM roadmap_milestones m
      WHERE m.id = milestone_id
      AND can_access_roadmap(m.roadmap_id, auth.uid())
    )
  );

CREATE POLICY milestone_epics_delete ON milestone_epics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM roadmap_milestones m
      WHERE m.id = milestone_id
      AND can_access_roadmap(m.roadmap_id, auth.uid())
    )
  );

-- ============================================================================
-- ROADMAP FEATURES POLICIES
-- ============================================================================

-- All operations: Access via epic's roadmap
CREATE POLICY roadmap_features_select ON roadmap_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap_epics e
      WHERE e.id = epic_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

CREATE POLICY roadmap_features_insert ON roadmap_features
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM roadmap_epics e
      WHERE e.id = epic_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

CREATE POLICY roadmap_features_update ON roadmap_features
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM roadmap_epics e
      WHERE e.id = epic_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

CREATE POLICY roadmap_features_delete ON roadmap_features
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM roadmap_epics e
      WHERE e.id = epic_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

-- ============================================================================
-- ROADMAP TASKS POLICIES
-- ============================================================================

-- SELECT: Project members can view tasks
CREATE POLICY roadmap_tasks_select ON roadmap_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap_features f
      JOIN roadmap_epics e ON f.epic_id = e.id
      WHERE f.id = feature_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

-- INSERT: Project members can create tasks
CREATE POLICY roadmap_tasks_insert ON roadmap_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM roadmap_features f
      JOIN roadmap_epics e ON f.epic_id = e.id
      WHERE f.id = feature_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

-- UPDATE: Assignee, reporter, or roadmap owner can update tasks
CREATE POLICY roadmap_tasks_update ON roadmap_tasks
  FOR UPDATE USING (
    assignee_id = auth.uid() OR
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM roadmap_features f
      JOIN roadmap_epics e ON f.epic_id = e.id
      JOIN roadmaps r ON e.roadmap_id = r.id
      WHERE f.id = feature_id AND r.owner_id = auth.uid()
    )
  );

-- DELETE: Reporter or roadmap owner can delete tasks
CREATE POLICY roadmap_tasks_delete ON roadmap_tasks
  FOR DELETE USING (
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM roadmap_features f
      JOIN roadmap_epics e ON f.epic_id = e.id
      JOIN roadmaps r ON e.roadmap_id = r.id
      WHERE f.id = feature_id AND r.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TASK COMMENTS POLICIES
-- ============================================================================

-- SELECT: Project members can view comments
CREATE POLICY task_comments_select ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap_tasks t
      JOIN roadmap_features f ON t.feature_id = f.id
      JOIN roadmap_epics e ON f.epic_id = e.id
      WHERE t.id = task_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

-- INSERT: Project members can add comments
CREATE POLICY task_comments_insert ON task_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM roadmap_tasks t
      JOIN roadmap_features f ON t.feature_id = f.id
      JOIN roadmap_epics e ON f.epic_id = e.id
      WHERE t.id = task_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

-- UPDATE: Only comment author can edit their own comments
CREATE POLICY task_comments_update ON task_comments
  FOR UPDATE USING (author_id = auth.uid());

-- DELETE: Author or roadmap owner can delete comments
CREATE POLICY task_comments_delete ON task_comments
  FOR DELETE USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM roadmap_tasks t
      JOIN roadmap_features f ON t.feature_id = f.id
      JOIN roadmap_epics e ON f.epic_id = e.id
      JOIN roadmaps r ON e.roadmap_id = r.id
      WHERE t.id = task_id AND r.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TASK ATTACHMENTS POLICIES
-- ============================================================================

-- SELECT: Project members can view attachments
CREATE POLICY task_attachments_select ON task_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap_tasks t
      JOIN roadmap_features f ON t.feature_id = f.id
      JOIN roadmap_epics e ON f.epic_id = e.id
      WHERE t.id = task_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

-- INSERT: Project members can upload attachments
CREATE POLICY task_attachments_insert ON task_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM roadmap_tasks t
      JOIN roadmap_features f ON t.feature_id = f.id
      JOIN roadmap_epics e ON f.epic_id = e.id
      WHERE t.id = task_id
      AND can_access_roadmap(e.roadmap_id, auth.uid())
    )
  );

-- DELETE: Uploader or roadmap owner can delete attachments
CREATE POLICY task_attachments_delete ON task_attachments
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM roadmap_tasks t
      JOIN roadmap_features f ON t.feature_id = f.id
      JOIN roadmap_epics e ON f.epic_id = e.id
      JOIN roadmaps r ON e.roadmap_id = r.id
      WHERE t.id = task_id AND r.owner_id = auth.uid()
    )
  );
