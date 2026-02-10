-- Make Project ID Optional for Draft Roadmaps
-- Migration: 20260210000001_make_project_id_optional.sql
-- Date: February 10, 2026
-- Description: Allows roadmaps to exist without a project (for guest users creating drafts)

-- ============================================================================
-- ALTER ROADMAPS TABLE
-- ============================================================================

-- Make project_id nullable
ALTER TABLE roadmaps ALTER COLUMN project_id DROP NOT NULL;

-- Drop the UNIQUE constraint on project_id (to allow multiple drafts before linking to project)
ALTER TABLE roadmaps DROP CONSTRAINT IF EXISTS roadmaps_project_id_key;

-- Add check constraint: drafts can exist without project, but active/completed roadmaps need one
ALTER TABLE roadmaps
ADD CONSTRAINT roadmaps_project_id_required_when_not_draft
CHECK (
  (project_id IS NOT NULL) OR 
  (status = 'draft')
);

-- Add index for querying roadmaps without projects (guest drafts)
CREATE INDEX IF NOT EXISTS idx_roadmaps_null_project_id ON roadmaps(owner_id) WHERE project_id IS NULL;

-- Add index to efficiently find existing roadmaps for a project (for uniqueness check in app)
CREATE INDEX IF NOT EXISTS idx_roadmaps_project_id ON roadmaps(project_id) WHERE project_id IS NOT NULL;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to link a draft roadmap to a project
CREATE OR REPLACE FUNCTION link_roadmap_to_project(
  roadmap_id_param UUID,
  project_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_roadmap_id UUID;
  roadmap_owner_id UUID;
  project_owner_id UUID;
BEGIN
  -- Check if roadmap exists and get its owner
  SELECT owner_id INTO roadmap_owner_id
  FROM roadmaps
  WHERE id = roadmap_id_param;
  
  IF roadmap_owner_id IS NULL THEN
    RAISE EXCEPTION 'Roadmap not found';
  END IF;
  
  -- Check if project exists and get its owner
  SELECT client_id INTO project_owner_id
  FROM projects
  WHERE id = project_id_param;
  
  IF project_owner_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  -- Verify the roadmap owner matches the project owner
  IF roadmap_owner_id != project_owner_id THEN
    RAISE EXCEPTION 'Roadmap owner must match project owner';
  END IF;
  
  -- Check if project already has a roadmap
  SELECT id INTO existing_roadmap_id
  FROM roadmaps
  WHERE project_id = project_id_param
  AND id != roadmap_id_param
  LIMIT 1;
  
  IF existing_roadmap_id IS NOT NULL THEN
    RAISE EXCEPTION 'Project already has a roadmap';
  END IF;
  
  -- Link the roadmap to the project
  UPDATE roadmaps
  SET 
    project_id = project_id_param,
    updated_at = now()
  WHERE id = roadmap_id_param;
  
  RETURN TRUE;
END;
$$;

-- Function to get or create default project for a roadmap
CREATE OR REPLACE FUNCTION get_or_create_default_project(
  user_id_param UUID,
  roadmap_name TEXT DEFAULT 'My Project'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_id UUID;
  project_title TEXT;
BEGIN
  -- Create a project title based on roadmap name
  project_title := COALESCE(roadmap_name, 'Untitled Project');
  
  -- Create new project
  INSERT INTO projects (
    id,
    title,
    status,
    client_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    project_title,
    'draft',
    user_id_param,
    now(),
    now()
  ) RETURNING id INTO project_id;
  
  RETURN project_id;
END;
$$;

-- ============================================================================
-- UPDATE EXISTING FOREIGN KEY
-- ============================================================================

-- The existing foreign key constraint should still work since we're only making it nullable
-- Verify the constraint exists and is set to CASCADE on project deletion
DO $$
BEGIN
  -- Check if the foreign key exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'roadmaps_project_id_fkey'
    AND table_name = 'roadmaps'
  ) THEN
    -- Drop and recreate with explicit CASCADE if needed
    ALTER TABLE roadmaps DROP CONSTRAINT roadmaps_project_id_fkey;
    ALTER TABLE roadmaps ADD CONSTRAINT roadmaps_project_id_fkey
      FOREIGN KEY (project_id)
      REFERENCES projects(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT roadmaps_project_id_required_when_not_draft ON roadmaps IS 
  'Draft roadmaps can exist without a project (for guest users), but active/completed roadmaps must be linked to a project';

COMMENT ON FUNCTION link_roadmap_to_project IS 
  'Links a draft roadmap to a project, ensuring ownership matches and no duplicate roadmaps per project';

COMMENT ON FUNCTION get_or_create_default_project IS 
  'Creates a default project for a user when migrating guest roadmaps to authenticated account';
