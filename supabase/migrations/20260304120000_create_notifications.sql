-- Notifications foundation (global + contextual)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_category'
  ) THEN
    CREATE TYPE public.notification_category AS ENUM ('global', 'specific');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_priority'
  ) THEN
    CREATE TYPE public.notification_priority AS ENUM ('low', 'medium', 'high');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.notification_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category public.notification_category NOT NULL,
  priority public.notification_priority NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  type_id uuid NOT NULL REFERENCES public.notification_types(id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id
  ON public.notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_notifications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_types_updated_at ON public.notification_types;
CREATE TRIGGER trg_notification_types_updated_at
BEFORE UPDATE ON public.notification_types
FOR EACH ROW
EXECUTE FUNCTION public.handle_notifications_updated_at();

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_notifications_updated_at();

ALTER TABLE public.notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view notification types"
ON public.notification_types;
CREATE POLICY "Authenticated users can view notification types"
ON public.notification_types
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their own notifications"
ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications"
ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

INSERT INTO public.notification_types (name, category, priority)
VALUES
  ('marketplace_profile_live', 'global', 'medium'),
  ('project_invite_received', 'specific', 'high'),
  ('project_invite_responded', 'specific', 'medium'),
  ('milestone_completed', 'specific', 'high'),
  ('chat_mention', 'specific', 'medium')
ON CONFLICT (name) DO NOTHING;
