-- Ensure project invite notification payload always includes a non-null message

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
        'message', coalesce(nullif(btrim(pi.message), ''), 'You have been invited to join this project team.'),
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