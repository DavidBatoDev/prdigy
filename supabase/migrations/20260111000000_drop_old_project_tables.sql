-- Drop existing project management tables to make way for roadmap canvas
-- Migration: 20260111000000_drop_old_project_tables.sql
-- Date: January 11, 2026

-- NOTE: This migration drops tables that will be replaced by the new roadmap canvas schema
-- Ensure you have backups if you have important data in these tables

-- Drop tables in reverse order of dependencies (child tables first)

-- Drop payment_checkpoints (references milestones and profiles)
DROP TABLE IF EXISTS payment_checkpoints CASCADE;

-- Drop work_items (references projects and profiles)
DROP TABLE IF EXISTS work_items CASCADE;

-- Drop milestones (references projects)
DROP TABLE IF EXISTS milestones CASCADE;

-- Drop transactions if it exists (may reference projects, wallets, payment_checkpoints)
DROP TABLE IF EXISTS transactions CASCADE;

-- Drop custom types that are no longer needed
DROP TYPE IF EXISTS work_item_type CASCADE;
DROP TYPE IF EXISTS work_item_status CASCADE;
DROP TYPE IF EXISTS milestone_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- Note: We're keeping the following types as they're still used by other tables:
-- - persona_type (used by profiles)
-- - project_status (used by projects)
-- - meeting_type (used by meetings)
-- - channel_type (used by chat_messages)

-- Add comment for tracking
COMMENT ON DATABASE postgres IS 'Dropped old project management tables on 2026-01-11 for roadmap canvas migration';
