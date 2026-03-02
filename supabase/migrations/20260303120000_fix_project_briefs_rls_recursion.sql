-- Fix recursive RLS causing intermittent 500s on project_briefs/project queries.
-- Root cause: policies on projects/project_members referenced each other through
-- subqueries that re-entered RLS evaluation.

-- Helper uses SECURITY DEFINER to check membership without RLS recursion.
CREATE OR REPLACE FUNCTION public.is_project_member(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = target_project_id
      AND pm.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_project_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;

-- Replace recursive project_members SELECT policy.
DROP POLICY IF EXISTS "Project members can view team" ON public.project_members;

CREATE POLICY "Project members can view team"
ON public.project_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_members.project_id
      AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid())
  )
  OR public.is_project_member(project_members.project_id)
);

-- Replace projects SELECT policy to avoid recursion path through project_members RLS.
DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;

CREATE POLICY "Project members can view projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = client_id
  OR auth.uid() = consultant_id
  OR public.is_project_member(id)
);