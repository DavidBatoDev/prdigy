ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_templatable boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_roadmaps_templates_public
  ON public.roadmaps (project_id, is_public, is_templatable);
