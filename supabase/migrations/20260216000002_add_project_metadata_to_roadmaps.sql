-- Add project_metadata JSONB field to roadmaps table
-- This will store all project-posting form fields in preparation for conversion to project

ALTER TABLE roadmaps 
ADD COLUMN project_metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN roadmaps.project_metadata IS 'Stores project-posting form data: title, category, description, problemSolving, projectState, skills, duration, budgetRange, fundingStatus, startDate, customStartDate';
