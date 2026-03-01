-- Migration: rename due_date to end_date on roadmap_epics,
--             add start_date + end_date to roadmap_features

-- 1. Rename due_date → end_date on roadmap_epics
ALTER TABLE public.roadmap_epics
  RENAME COLUMN due_date TO end_date;

-- 2. Add start_date and end_date to roadmap_features
ALTER TABLE public.roadmap_features
  ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS end_date   timestamp with time zone;
