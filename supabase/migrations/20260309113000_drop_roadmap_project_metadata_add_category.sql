-- Remove roadmap project metadata blob and add a first-class roadmap category.

ALTER TABLE public.roadmaps
DROP COLUMN IF EXISTS project_metadata;

ALTER TABLE public.roadmaps
ADD COLUMN IF NOT EXISTS category text;
