-- Remove unused fields from roadmap_tasks table
-- Migration: 20260209000000_remove_unused_task_fields.sql
-- Date: February 9, 2026
-- Description: Removes checklist, labels, actual_hours, description, assignee_id, reporter_id, and background_color from roadmap_tasks

-- Drop indexes that reference the columns we're removing
DROP INDEX IF EXISTS idx_roadmap_tasks_assignee_id;
DROP INDEX IF EXISTS idx_roadmap_tasks_reporter_id;
DROP INDEX IF EXISTS idx_roadmap_tasks_labels;

-- Remove the columns (CASCADE will remove foreign key constraints)
ALTER TABLE roadmap_tasks DROP COLUMN IF EXISTS checklist CASCADE;
ALTER TABLE roadmap_tasks DROP COLUMN IF EXISTS labels CASCADE;
ALTER TABLE roadmap_tasks DROP COLUMN IF EXISTS actual_hours CASCADE;
ALTER TABLE roadmap_tasks DROP COLUMN IF EXISTS description CASCADE;
ALTER TABLE roadmap_tasks DROP COLUMN IF EXISTS assignee_id CASCADE;
ALTER TABLE roadmap_tasks DROP COLUMN IF EXISTS reporter_id CASCADE;
ALTER TABLE roadmap_tasks DROP COLUMN IF EXISTS background_color CASCADE;
ALTER TABLE roadmap_tasks DROP COLUMN IF EXISTS estimated_hours CASCADE;
