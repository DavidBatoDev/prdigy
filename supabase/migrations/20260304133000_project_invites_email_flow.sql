-- Support email-first project invites for existing and future users

ALTER TABLE public.project_invites
  ADD COLUMN IF NOT EXISTS invitee_email text,
  ADD COLUMN IF NOT EXISTS invited_role text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

ALTER TABLE public.project_invites
  ALTER COLUMN invitee_id DROP NOT NULL;

UPDATE public.project_invites pi
SET invitee_email = lower(p.email)
FROM public.profiles p
WHERE pi.invitee_id = p.id
  AND pi.invitee_email IS NULL
  AND p.email IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_invites_invitee_presence_check'
  ) THEN
    ALTER TABLE public.project_invites
      ADD CONSTRAINT project_invites_invitee_presence_check
      CHECK (invitee_id IS NOT NULL OR invitee_email IS NOT NULL);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_invites_project_email_unique'
  ) THEN
    ALTER TABLE public.project_invites
      ADD CONSTRAINT project_invites_project_email_unique
      UNIQUE (project_id, invitee_email);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_project_invites_invitee_email
  ON public.project_invites(invitee_email);

CREATE OR REPLACE FUNCTION public.handle_profile_project_invites_reconciliation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_type_id uuid;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.project_invites pi
  SET
    invitee_id = NEW.id,
    updated_at = now()
  WHERE pi.invitee_id IS NULL
    AND pi.invitee_email IS NOT NULL
    AND lower(pi.invitee_email) = lower(NEW.email)
    AND pi.status = 'pending';

  SELECT id INTO v_notification_type_id
  FROM public.notification_types
  WHERE name = 'project_invite_received'
  LIMIT 1;

  IF v_notification_type_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, project_id, type_id, actor_id, content, link_url)
    SELECT
      NEW.id,
      pi.project_id,
      v_notification_type_id,
      pi.invited_by,
      jsonb_build_object(
        'invite_id', pi.id,
        'message', pi.message,
        'invited_role', pi.invited_role
      ),
      '/freelancer/invites'
    FROM public.project_invites pi
    WHERE pi.invitee_id = NEW.id
      AND pi.status = 'pending'
      AND pi.created_at >= now() - interval '1 minute'
      AND NOT EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.user_id = NEW.id
          AND n.project_id = pi.project_id
          AND n.type_id = v_notification_type_id
          AND n.content ->> 'invite_id' = pi.id::text
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_reconcile_project_invites ON public.profiles;
CREATE TRIGGER trg_profiles_reconcile_project_invites
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_project_invites_reconciliation();
