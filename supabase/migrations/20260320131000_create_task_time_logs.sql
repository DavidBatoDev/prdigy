CREATE TABLE IF NOT EXISTS public.task_time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.roadmap_tasks(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  duration_seconds integer,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  review_note text,
  source text NOT NULL DEFAULT 'timer'
    CHECK (source IN ('timer', 'manual')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT task_time_logs_end_after_start
    CHECK (ended_at IS NULL OR ended_at > started_at),
  CONSTRAINT task_time_logs_duration_non_negative
    CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS idx_task_time_logs_project_member_started
  ON public.task_time_logs (project_id, member_user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_time_logs_project_status_started
  ON public.task_time_logs (project_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_started
  ON public.task_time_logs (task_id, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_task_time_logs_one_active_per_member_project
  ON public.task_time_logs (project_id, member_user_id)
  WHERE ended_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_task_time_logs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_task_time_logs_updated_at ON public.task_time_logs;
CREATE TRIGGER trg_set_task_time_logs_updated_at
BEFORE UPDATE ON public.task_time_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_task_time_logs_updated_at();

-- ---------------------------------------------------------------------------
-- ROLLBACK (manual)
-- Run the block below manually if you need to revert this migration.
-- NOTE: this drops task_time_logs and all data in it.
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_set_task_time_logs_updated_at ON public.task_time_logs;
-- DROP FUNCTION IF EXISTS public.set_task_time_logs_updated_at();
-- DROP INDEX IF EXISTS uq_task_time_logs_one_active_per_member_project;
-- DROP INDEX IF EXISTS idx_task_time_logs_task_started;
-- DROP INDEX IF EXISTS idx_task_time_logs_project_status_started;
-- DROP INDEX IF EXISTS idx_task_time_logs_project_member_started;
-- DROP TABLE IF EXISTS public.task_time_logs;
-- COMMIT;
