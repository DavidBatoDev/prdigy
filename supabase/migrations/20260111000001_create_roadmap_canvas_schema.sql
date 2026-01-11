-- Roadmap Canvas Schema
-- Migration: 20260111000001_create_roadmap_canvas_schema.sql
-- Date: January 11, 2026
-- Description: Creates the complete roadmap canvas schema for project management

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Roadmap status
CREATE TYPE roadmap_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
);

-- Milestone status
CREATE TYPE roadmap_milestone_status AS ENUM (
  'not_started',
  'in_progress',
  'at_risk',
  'completed',
  'missed'
);

-- Epic status
CREATE TYPE epic_status AS ENUM (
  'backlog',
  'planned',
  'in_progress',
  'in_review',
  'completed',
  'on_hold'
);

-- Epic priority
CREATE TYPE epic_priority AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'nice_to_have'
);

-- Feature status
CREATE TYPE feature_status AS ENUM (
  'not_started',
  'in_progress',
  'in_review',
  'completed',
  'blocked'
);

-- Task status
CREATE TYPE task_status AS ENUM (
  'todo',
  'in_progress',
  'in_review',
  'done',
  'blocked'
);

-- Task priority
CREATE TYPE task_priority AS ENUM (
  'urgent',
  'high',
  'medium',
  'low'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Roadmaps table
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status roadmap_status DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roadmap milestones table
CREATE TABLE roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  status roadmap_milestone_status DEFAULT 'not_started',
  position INTEGER NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(roadmap_id, position)
);

-- Roadmap epics table
CREATE TABLE roadmap_epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority epic_priority DEFAULT 'medium',
  status epic_status DEFAULT 'backlog',
  position INTEGER NOT NULL,
  color TEXT,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2),
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(roadmap_id, position)
);

-- Milestone-Epic junction table (many-to-many)
CREATE TABLE milestone_epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
  epic_id UUID NOT NULL REFERENCES roadmap_epics(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(milestone_id, epic_id)
);

-- Roadmap features table
CREATE TABLE roadmap_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epic_id UUID NOT NULL REFERENCES roadmap_epics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status feature_status DEFAULT 'not_started',
  position INTEGER NOT NULL,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(epic_id, position)
);

-- Roadmap tasks table
CREATE TABLE roadmap_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES roadmap_features(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  position INTEGER NOT NULL,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  labels TEXT[] DEFAULT '{}',
  checklist JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_id, position)
);

-- Task comments table
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES roadmap_tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task attachments table
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES roadmap_tasks(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Roadmaps indexes
CREATE INDEX idx_roadmaps_project_id ON roadmaps(project_id);
CREATE INDEX idx_roadmaps_owner_id ON roadmaps(owner_id);
CREATE INDEX idx_roadmaps_status ON roadmaps(status);

-- Milestones indexes
CREATE INDEX idx_roadmap_milestones_roadmap_id ON roadmap_milestones(roadmap_id);
CREATE INDEX idx_roadmap_milestones_status ON roadmap_milestones(status);
CREATE INDEX idx_roadmap_milestones_target_date ON roadmap_milestones(target_date);
CREATE INDEX idx_roadmap_milestones_position ON roadmap_milestones(roadmap_id, position);

-- Epics indexes
CREATE INDEX idx_roadmap_epics_roadmap_id ON roadmap_epics(roadmap_id);
CREATE INDEX idx_roadmap_epics_status ON roadmap_epics(status);
CREATE INDEX idx_roadmap_epics_priority ON roadmap_epics(priority);
CREATE INDEX idx_roadmap_epics_position ON roadmap_epics(roadmap_id, position);
CREATE INDEX idx_roadmap_epics_tags ON roadmap_epics USING GIN(tags);

-- Milestone-Epic junction indexes
CREATE INDEX idx_milestone_epics_milestone_id ON milestone_epics(milestone_id);
CREATE INDEX idx_milestone_epics_epic_id ON milestone_epics(epic_id);

-- Features indexes
CREATE INDEX idx_roadmap_features_epic_id ON roadmap_features(epic_id);
CREATE INDEX idx_roadmap_features_status ON roadmap_features(status);
CREATE INDEX idx_roadmap_features_position ON roadmap_features(epic_id, position);

-- Tasks indexes
CREATE INDEX idx_roadmap_tasks_feature_id ON roadmap_tasks(feature_id);
CREATE INDEX idx_roadmap_tasks_assignee_id ON roadmap_tasks(assignee_id);
CREATE INDEX idx_roadmap_tasks_reporter_id ON roadmap_tasks(reporter_id);
CREATE INDEX idx_roadmap_tasks_status ON roadmap_tasks(status);
CREATE INDEX idx_roadmap_tasks_priority ON roadmap_tasks(priority);
CREATE INDEX idx_roadmap_tasks_due_date ON roadmap_tasks(due_date);
CREATE INDEX idx_roadmap_tasks_labels ON roadmap_tasks USING GIN(labels);
CREATE INDEX idx_roadmap_tasks_position ON roadmap_tasks(feature_id, position);

-- Comments indexes
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_author_id ON task_comments(author_id);

-- Attachments indexes
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);

-- ============================================================================
-- PROGRESS CALCULATION FUNCTIONS
-- ============================================================================

-- Calculate task progress percentage based on status
CREATE OR REPLACE FUNCTION get_task_progress(p_status task_status)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE p_status
    WHEN 'todo' THEN 0
    WHEN 'in_progress' THEN 25
    WHEN 'in_review' THEN 75
    WHEN 'done' THEN 100
    WHEN 'blocked' THEN 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate feature progress (average of task progress)
CREATE OR REPLACE FUNCTION get_feature_progress(p_feature_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT AVG(get_task_progress(status))
     FROM roadmap_tasks
     WHERE feature_id = p_feature_id),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate epic progress (average of feature progress)
CREATE OR REPLACE FUNCTION get_epic_progress(p_epic_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT AVG(get_feature_progress(id))
     FROM roadmap_features
     WHERE epic_id = p_epic_id),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate milestone progress (average of linked epic progress)
CREATE OR REPLACE FUNCTION get_milestone_progress(p_milestone_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT AVG(get_epic_progress(epic_id))
     FROM milestone_epics
     WHERE milestone_id = p_milestone_id),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate roadmap progress (average of milestone progress)
CREATE OR REPLACE FUNCTION get_roadmap_progress(p_roadmap_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT AVG(get_milestone_progress(id))
     FROM roadmap_milestones
     WHERE roadmap_id = p_roadmap_id),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if user is a project member
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = p_project_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND (client_id = p_user_id OR consultant_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can access roadmap
CREATE OR REPLACE FUNCTION can_access_roadmap(p_roadmap_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT project_id INTO v_project_id FROM roadmaps WHERE id = p_roadmap_id;
  RETURN is_project_member(v_project_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_milestones_updated_at BEFORE UPDATE ON roadmap_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_epics_updated_at BEFORE UPDATE ON roadmap_epics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_features_updated_at BEFORE UPDATE ON roadmap_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_tasks_updated_at BEFORE UPDATE ON roadmap_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE roadmaps IS 'Top-level roadmap container, one per project';
COMMENT ON TABLE roadmap_milestones IS 'Timeline checkpoints that define success criteria';
COMMENT ON TABLE roadmap_epics IS 'Large work units representing major deliverables';
COMMENT ON TABLE milestone_epics IS 'Many-to-many junction table linking milestones to epics';
COMMENT ON TABLE roadmap_features IS 'Components within an epic that group related tasks';
COMMENT ON TABLE roadmap_tasks IS 'Smallest unit of work - assignable, trackable items';
COMMENT ON TABLE task_comments IS 'Comments and discussions on tasks';
COMMENT ON TABLE task_attachments IS 'File attachments for tasks';
