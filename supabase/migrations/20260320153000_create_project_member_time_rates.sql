CREATE TABLE IF NOT EXISTS public.project_member_time_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_member_id uuid NOT NULL REFERENCES public.project_members(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hourly_rate numeric(10,2) NOT NULL CHECK (hourly_rate >= 0),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_member_time_rates_project_member UNIQUE (project_id, project_member_id),
  CONSTRAINT uq_project_member_time_rates_project_user UNIQUE (project_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_member_time_rates_project
  ON public.project_member_time_rates (project_id);

CREATE INDEX IF NOT EXISTS idx_project_member_time_rates_project_user
  ON public.project_member_time_rates (project_id, member_user_id);

CREATE OR REPLACE FUNCTION public.set_project_member_time_rates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_project_member_time_rates_updated_at ON public.project_member_time_rates;
CREATE TRIGGER trg_set_project_member_time_rates_updated_at
BEFORE UPDATE ON public.project_member_time_rates
FOR EACH ROW
EXECUTE FUNCTION public.set_project_member_time_rates_updated_at();

-- ---------------------------------------------------------------------------
-- ROLLBACK (manual)
-- Run the block below manually if you need to revert this migration.
-- NOTE: this drops project_member_time_rates and all data in it.
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_set_project_member_time_rates_updated_at ON public.project_member_time_rates;
-- DROP FUNCTION IF EXISTS public.set_project_member_time_rates_updated_at();
-- DROP INDEX IF EXISTS idx_project_member_time_rates_project_user;
-- DROP INDEX IF EXISTS idx_project_member_time_rates_project;
-- DROP TABLE IF EXISTS public.project_member_time_rates;
-- COMMIT;
