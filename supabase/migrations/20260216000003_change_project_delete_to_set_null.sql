-- Change project deletion behavior to preserve roadmaps
-- Migration: 20260216000003_change_project_delete_to_set_null.sql
-- Date: February 16, 2026
-- Description: When a project is deleted, set roadmap's project_id to NULL instead of deleting the roadmap

-- Drop the existing foreign key constraint
ALTER TABLE roadmaps DROP CONSTRAINT IF EXISTS roadmaps_project_id_fkey;

-- Recreate the constraint with ON DELETE SET NULL
ALTER TABLE roadmaps ADD CONSTRAINT roadmaps_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT roadmaps_project_id_fkey ON roadmaps IS 
  'When a project is deleted, the roadmap is preserved with project_id set to NULL';
