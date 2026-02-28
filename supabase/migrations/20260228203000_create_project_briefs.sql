-- Migration: Create project_briefs table and update projects
-- Description: Moves strategic project data (brief, description) from projects to a dedicated project_briefs table

-- Create project_briefs table
CREATE TABLE IF NOT EXISTS project_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mission_vision TEXT,
    scope_statement TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,
    constraints TEXT,
    risk_register JSONB DEFAULT '[]'::jsonb,
    visibility_mask JSONB DEFAULT '{}'::jsonb, -- e.g., {"risk_register": "internal", "mission_vision": "public"}
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT project_briefs_project_version_key UNIQUE(project_id, version)
);

-- Copy existing brief and description data to project_briefs
INSERT INTO project_briefs (project_id, mission_vision, scope_statement)
SELECT id, brief, description
FROM projects
WHERE brief IS NOT NULL OR description IS NOT NULL;

-- Remove columns from projects table to avoid data staleness
ALTER TABLE projects DROP COLUMN IF EXISTS brief;
ALTER TABLE projects DROP COLUMN IF EXISTS description;

-- Add updated_at trigger for project_briefs
CREATE TRIGGER update_project_briefs_updated_at BEFORE UPDATE ON project_briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_briefs_project_id ON project_briefs(project_id);

-- Enable RLS
ALTER TABLE project_briefs ENABLE ROW LEVEL SECURITY;

-- Project members can view project briefs
CREATE POLICY "Project members can view project briefs" ON project_briefs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = project_briefs.project_id
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_briefs.project_id
            AND (projects.client_id = auth.uid() OR projects.consultant_id = auth.uid())
        )
    );

-- Project members can update project briefs
CREATE POLICY "Project members can update project briefs" ON project_briefs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = project_briefs.project_id
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_briefs.project_id
            AND (projects.client_id = auth.uid() OR projects.consultant_id = auth.uid())
        )
    );

-- Project members can insert project briefs
CREATE POLICY "Project members can insert project briefs" ON project_briefs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = project_briefs.project_id
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_briefs.project_id
        )
    );

-- ==============================================================================
-- ROLLBACK COMMANDS
-- ==============================================================================
/*
-- 1. Restore columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brief TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Restore data from project_briefs back to projects
UPDATE projects 
SET brief = pb.mission_vision,
    description = pb.scope_statement
FROM project_briefs pb
WHERE projects.id = pb.project_id;

-- 3. Drop project_briefs policies
DROP POLICY IF EXISTS "Project members can view project briefs" ON project_briefs;
DROP POLICY IF EXISTS "Project members can update project briefs" ON project_briefs;
DROP POLICY IF EXISTS "Project members can insert project briefs" ON project_briefs;

-- 4. Drop trigger
DROP TRIGGER IF EXISTS update_project_briefs_updated_at ON project_briefs;

-- 5. Drop table (cascades indexes)
DROP TABLE IF EXISTS project_briefs;
*/
