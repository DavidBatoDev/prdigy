-- Add member_type column to project_members to distinguish stakeholders,
-- hired freelancers, and unfilled open-role slots.

ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS member_type text NOT NULL DEFAULT 'freelancer'
  CONSTRAINT project_members_member_type_check
    CHECK (member_type IN ('stakeholder', 'freelancer', 'open_role'));

-- Allow NULL user_id for open-role placeholder rows
ALTER TABLE public.project_members
  ALTER COLUMN user_id DROP NOT NULL;

-- Back-fill existing rows: client/consultant rows are stakeholders
UPDATE public.project_members
SET member_type = 'stakeholder'
WHERE lower(role) IN ('client', 'consultant', 'consultant (lead)');

-- Add unique constraint only for real users (not open-role placeholders)
-- Remove the existing unique constraint if any, then add partial one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_members_project_user_unique'
  ) THEN
    ALTER TABLE public.project_members
      ADD CONSTRAINT project_members_project_user_unique
        UNIQUE (project_id, user_id);
  END IF;
END $$;
