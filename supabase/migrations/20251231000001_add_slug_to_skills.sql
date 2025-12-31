-- Add slug column
ALTER TABLE skills ADD COLUMN slug TEXT;

-- Backfill slugs for existing skills
UPDATE skills 
SET slug = lower(replace(name, ' ', '-'));

-- Make slug required and unique
ALTER TABLE skills ALTER COLUMN slug SET NOT NULL;
ALTER TABLE skills ADD CONSTRAINT skills_slug_key UNIQUE (slug);
