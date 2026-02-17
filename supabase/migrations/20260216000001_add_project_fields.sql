-- Add project posting form fields to projects table
-- Migration: 20260216000001_add_project_fields.sql
-- Date: February 16, 2026
-- Description: Adds columns for storing project-posting form data (category, skills, budget, etc.)

-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_state TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_status TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_start_date TIMESTAMPTZ;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_budget_range ON projects(budget_range);
CREATE INDEX IF NOT EXISTS idx_projects_project_state ON projects(project_state);

-- Add comments for documentation
COMMENT ON COLUMN projects.description IS 'Detailed project description from project-posting form';
COMMENT ON COLUMN projects.category IS 'Project category (e.g., Web Development, Mobile App, etc.)';
COMMENT ON COLUMN projects.project_state IS 'Initial project state: idea, sketches, design, or codebase';
COMMENT ON COLUMN projects.skills IS 'Array of required skills for the project';
COMMENT ON COLUMN projects.duration IS 'Expected project duration (e.g., 1-3_months, 3-6_months)';
COMMENT ON COLUMN projects.budget_range IS 'Budget range for the project (e.g., < $1,000, $1k - $5k)';
COMMENT ON COLUMN projects.funding_status IS 'Funding status: self-funded, seed, series-a, series-b, bootstrapped';
COMMENT ON COLUMN projects.start_date IS 'Desired start timeframe: immediately, within-month, or custom';
COMMENT ON COLUMN projects.custom_start_date IS 'Custom start date if start_date is set to custom';
