-- Freelancer marketplace activation + consultant invite flow

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE POLICY "Verified consultants can view public freelancers"
ON public.profiles
FOR SELECT
USING (
  is_public = true
  AND EXISTS (
    SELECT 1
    FROM public.profiles viewer
    WHERE viewer.id = auth.uid()
      AND viewer.is_consultant_verified = true
  )
);

CREATE TABLE IF NOT EXISTS public.project_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_project_invites_project_id ON public.project_invites(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_invited_by ON public.project_invites(invited_by);
CREATE INDEX IF NOT EXISTS idx_project_invites_invitee_id ON public.project_invites(invitee_id);

ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviters can create project invites"
ON public.project_invites
FOR INSERT
WITH CHECK (
  invited_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.consultant_id = auth.uid() OR p.client_id = auth.uid())
  )
);

CREATE POLICY "Inviter and invitee can view invites"
ON public.project_invites
FOR SELECT
USING (invited_by = auth.uid() OR invitee_id = auth.uid());

CREATE POLICY "Invitee can update invite status"
ON public.project_invites
FOR UPDATE
USING (invitee_id = auth.uid())
WITH CHECK (invitee_id = auth.uid());