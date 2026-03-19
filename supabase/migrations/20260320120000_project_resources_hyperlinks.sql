-- Project Resources (Hyperlink-only)
-- Adds one-level folders + links (including uncategorized links).

CREATE TABLE IF NOT EXISTS public.project_resource_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_resource_folders_name_not_blank
    CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT project_resource_folders_name_length
    CHECK (char_length(name) <= 120),
  CONSTRAINT project_resource_folders_position_non_negative
    CHECK (position >= 0),
  CONSTRAINT project_resource_folders_project_position_unique
    UNIQUE (project_id, position)
);

CREATE TABLE IF NOT EXISTS public.project_resource_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.project_resource_folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_resource_links_title_not_blank
    CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT project_resource_links_title_length
    CHECK (char_length(title) <= 255),
  CONSTRAINT project_resource_links_url_length
    CHECK (char_length(url) <= 2048),
  CONSTRAINT project_resource_links_url_http_https
    CHECK (url ~* '^https?://'),
  CONSTRAINT project_resource_links_description_length
    CHECK (description IS NULL OR char_length(description) <= 2000),
  CONSTRAINT project_resource_links_position_non_negative
    CHECK (position >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_resource_folders_project_name_ci
  ON public.project_resource_folders (project_id, lower(btrim(name)));

CREATE INDEX IF NOT EXISTS idx_project_resource_folders_project_position
  ON public.project_resource_folders (project_id, position);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_resource_links_project_folder_position_unique
  ON public.project_resource_links (project_id, folder_id, position)
  WHERE folder_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_resource_links_project_uncategorized_position_unique
  ON public.project_resource_links (project_id, position)
  WHERE folder_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_resource_links_project_folder_position
  ON public.project_resource_links (project_id, folder_id, position);

CREATE OR REPLACE FUNCTION public.validate_project_resource_link_folder_project()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_folder_project_id uuid;
BEGIN
  IF NEW.folder_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT f.project_id
  INTO v_folder_project_id
  FROM public.project_resource_folders f
  WHERE f.id = NEW.folder_id;

  IF v_folder_project_id IS NULL THEN
    RAISE EXCEPTION 'Resource folder % does not exist', NEW.folder_id
      USING ERRCODE = '23503';
  END IF;

  IF v_folder_project_id <> NEW.project_id THEN
    RAISE EXCEPTION 'Resource link folder must belong to the same project'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_project_resource_links_on_folder_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_position integer;
BEGIN
  SELECT COALESCE(MAX(l.position) + 1, 0)
  INTO v_next_position
  FROM public.project_resource_links l
  WHERE l.project_id = OLD.project_id
    AND l.folder_id IS NULL;

  WITH links_to_move AS (
    SELECT
      l.id,
      ROW_NUMBER() OVER (ORDER BY l.position, l.created_at, l.id) - 1 AS order_idx
    FROM public.project_resource_links l
    WHERE l.project_id = OLD.project_id
      AND l.folder_id = OLD.id
  )
  UPDATE public.project_resource_links l
  SET
    folder_id = NULL,
    position = v_next_position + m.order_idx,
    updated_at = now()
  FROM links_to_move m
  WHERE l.id = m.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_resource_links_validate_folder_project
ON public.project_resource_links;
CREATE TRIGGER trg_project_resource_links_validate_folder_project
BEFORE INSERT OR UPDATE OF project_id, folder_id
ON public.project_resource_links
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_resource_link_folder_project();

DROP TRIGGER IF EXISTS trg_project_resource_folders_move_links_before_delete
ON public.project_resource_folders;
CREATE TRIGGER trg_project_resource_folders_move_links_before_delete
BEFORE DELETE
ON public.project_resource_folders
FOR EACH ROW
EXECUTE FUNCTION public.move_project_resource_links_on_folder_delete();

DROP TRIGGER IF EXISTS trg_project_resource_folders_updated_at
ON public.project_resource_folders;
CREATE TRIGGER trg_project_resource_folders_updated_at
BEFORE UPDATE
ON public.project_resource_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_project_resource_links_updated_at
ON public.project_resource_links;
CREATE TRIGGER trg_project_resource_links_updated_at
BEFORE UPDATE
ON public.project_resource_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_resource_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resource_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project participants can view resource folders"
ON public.project_resource_folders;
CREATE POLICY "Project participants can view resource folders"
ON public.project_resource_folders
FOR SELECT
USING (public.is_project_member(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project participants can insert resource folders"
ON public.project_resource_folders;
CREATE POLICY "Project participants can insert resource folders"
ON public.project_resource_folders
FOR INSERT
WITH CHECK (public.is_project_member(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project participants can update resource folders"
ON public.project_resource_folders;
CREATE POLICY "Project participants can update resource folders"
ON public.project_resource_folders
FOR UPDATE
USING (public.is_project_member(project_id, auth.uid()))
WITH CHECK (public.is_project_member(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project participants can delete resource folders"
ON public.project_resource_folders;
CREATE POLICY "Project participants can delete resource folders"
ON public.project_resource_folders
FOR DELETE
USING (public.is_project_member(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project participants can view resource links"
ON public.project_resource_links;
CREATE POLICY "Project participants can view resource links"
ON public.project_resource_links
FOR SELECT
USING (public.is_project_member(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project participants can insert resource links"
ON public.project_resource_links;
CREATE POLICY "Project participants can insert resource links"
ON public.project_resource_links
FOR INSERT
WITH CHECK (public.is_project_member(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project participants can update resource links"
ON public.project_resource_links;
CREATE POLICY "Project participants can update resource links"
ON public.project_resource_links
FOR UPDATE
USING (public.is_project_member(project_id, auth.uid()))
WITH CHECK (public.is_project_member(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project participants can delete resource links"
ON public.project_resource_links;
CREATE POLICY "Project participants can delete resource links"
ON public.project_resource_links
FOR DELETE
USING (public.is_project_member(project_id, auth.uid()));

COMMENT ON TABLE public.project_resource_folders
IS 'Organizational folders for project resources (hyperlinks only).';

COMMENT ON TABLE public.project_resource_links
IS 'Hyperlink resources for projects, optionally grouped in folders.';
