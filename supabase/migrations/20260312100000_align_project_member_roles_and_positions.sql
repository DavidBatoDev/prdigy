-- Align project member roles and positions.
-- Roles become strict authorization values: consultant | client | member.
-- Human-readable titles move to project_members.position and project_invites.invited_position.

ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS position text;

-- Backfill/normalize while supporting remotes that already dropped member_type.
DO $$
DECLARE
  v_role_source text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_members'
      AND column_name = 'member_type'
  ) THEN
    v_role_source := 'coalesce(nullif(btrim(role), ''''), nullif(btrim(member_type), ''''))';
  ELSE
    v_role_source := 'nullif(btrim(role), '''')';
  END IF;

  EXECUTE format(
    $sql$
    UPDATE public.project_members
    SET position = CASE
      WHEN lower(%1$s) IN ('consultant', 'consultant (lead)') THEN 'Main Consultant'
      WHEN lower(%1$s) = 'client' THEN 'Client'
      WHEN lower(%1$s) IN ('member', 'freelancer') THEN 'Member'
      WHEN %1$s IS NULL THEN 'Member'
      ELSE initcap(replace(lower(%1$s), '_', ' '))
    END
    WHERE nullif(btrim(position), '') IS NULL
    $sql$,
    v_role_source
  );

  EXECUTE format(
    $sql$
    UPDATE public.project_members
    SET role = CASE
      WHEN lower(%1$s) IN ('consultant', 'consultant (lead)') THEN 'consultant'
      WHEN lower(%1$s) = 'client' THEN 'client'
      ELSE 'member'
    END
    $sql$,
    v_role_source
  );
END $$;

ALTER TABLE public.project_members
  ALTER COLUMN role SET DEFAULT 'member';

ALTER TABLE public.project_members
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE public.project_members
  DROP CONSTRAINT IF EXISTS project_members_role_check;

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_role_check
  CHECK (role IN ('consultant', 'client', 'member'));

ALTER TABLE public.project_members
  DROP COLUMN IF EXISTS member_type;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_invites'
      AND column_name = 'invited_role'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'project_invites'
        AND column_name = 'invited_position'
    ) THEN
      EXECUTE 'ALTER TABLE public.project_invites RENAME COLUMN invited_role TO invited_position';
    ELSE
      EXECUTE 'UPDATE public.project_invites SET invited_position = COALESCE(invited_position, invited_role)';
      EXECUTE 'ALTER TABLE public.project_invites DROP COLUMN invited_role';
    END IF;
  END IF;
END $$;

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
        'message',
          coalesce(nullif(btrim(inviter.display_name), ''), 'A team lead')
          || ' invited you to join '
          || coalesce(p.title, 'this project')
          || CASE
               WHEN nullif(btrim(pi.invited_position), '') IS NOT NULL
                 THEN ' as ' || btrim(pi.invited_position)
               ELSE ''
             END
          || '.'
          || CASE
               WHEN nullif(btrim(pi.message), '') IS NOT NULL
                 THEN ' Note: ' || btrim(pi.message)
               ELSE ''
             END,
        'invited_position', pi.invited_position,
        'project_title', p.title,
        'inviter_name', coalesce(nullif(btrim(inviter.display_name), ''), 'A team lead'),
        'note', nullif(btrim(pi.message), '')
      ),
      '/freelancer/invites'
    FROM public.project_invites pi
    LEFT JOIN public.projects p ON p.id = pi.project_id
    LEFT JOIN public.profiles inviter ON inviter.id = pi.invited_by
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
