-- =============================================================================
-- Migration: Identity & Vetting Domain
-- Created: 2026-02-26
-- Description: Adds 13 new tables for the Identity & Vetting domain.
--   Replaces the JSONB profiles.skills column with the user_skills join table.
-- =============================================================================


-- =============================================================================
-- DOMAIN 1: Core Identity — extend profiles
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline TEXT;

COMMENT ON COLUMN public.profiles.headline
  IS 'Short professional tagline shown on the public profile, e.g. "Senior Full-Stack Engineer"';


-- =============================================================================
-- DOMAIN 2: Trust & Verification
-- =============================================================================

-- Enum for verification types
DO $$ BEGIN
  CREATE TYPE public.verification_type AS ENUM ('email', 'phone', 'identity');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum for verification statuses
DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum for identity document types
DO $$ BEGIN
  CREATE TYPE public.identity_document_type AS ENUM ('passport', 'national_id', 'drivers_license', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Track completion of each verification layer per user
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           public.verification_type NOT NULL,
  status         public.verification_status NOT NULL DEFAULT 'pending',
  verified_at    TIMESTAMP WITH TIME ZONE,
  notes          TEXT,                    -- Admin notes (e.g. reason for failure)
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, type)
);

COMMENT ON TABLE public.user_verifications
  IS 'Tracks verification progress per user per type (email, phone, identity). Used by Admins to approve Consultant applications.';

-- Store private KYC documents (paths point to private Supabase Storage bucket)
CREATE TABLE IF NOT EXISTS public.user_identity_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           public.identity_document_type NOT NULL DEFAULT 'other',
  storage_path   TEXT NOT NULL,           -- Private bucket path
  is_verified    BOOLEAN DEFAULT FALSE,
  expires_at     DATE,
  uploaded_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at    TIMESTAMP WITH TIME ZONE,
  verified_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_identity_documents
  IS 'Stores private KYC identity documents. Paths reference a private Supabase Storage bucket. Required for Consultant verification.';


-- =============================================================================
-- DOMAIN 3: Credentials & Authority
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_educations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution      TEXT NOT NULL,
  degree           TEXT,                  -- e.g. "Bachelor of Science"
  field_of_study   TEXT,                  -- e.g. "Computer Science"
  start_year       SMALLINT,
  end_year         SMALLINT,
  is_current       BOOLEAN DEFAULT FALSE,
  description      TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_certifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,          -- e.g. "AWS Solutions Architect"
  issuer           TEXT NOT NULL,          -- e.g. "Amazon Web Services"
  issue_date       DATE,
  expiry_date      DATE,
  credential_id    TEXT,                   -- Certificate ID/number
  credential_url   TEXT,                   -- Public verification link
  is_verified      BOOLEAN DEFAULT FALSE,  -- Admin-verified
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_certifications
  IS 'Professional certifications (AWS, PMP, Scrum Master, etc.). is_verified is set by Admins during Consultant vetting.';

-- Enum for license types (regulatory industries)
DO $$ BEGIN
  CREATE TYPE public.license_type AS ENUM ('legal', 'engineering', 'medical', 'financial', 'real_estate', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_licenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  type                public.license_type DEFAULT 'other',
  issuing_authority   TEXT NOT NULL,
  license_number      TEXT,
  issue_date          DATE,
  expiry_date         DATE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_licenses
  IS 'Legal/trade licenses for regulated industries. Validated by Admins during Consultant vetting.';


-- =============================================================================
-- DOMAIN 4: Skills & Taxonomy
-- Note: the `skills` master table already exists from migration 20251231000000.
-- =============================================================================

-- Enum for skill proficiency levels
DO $$ BEGIN
  CREATE TYPE public.proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Join table replacing profiles.skills JSONB
CREATE TABLE IF NOT EXISTS public.user_skills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id          UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level public.proficiency_level NOT NULL DEFAULT 'intermediate',
  years_experience  SMALLINT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

COMMENT ON TABLE public.user_skills
  IS 'Many-to-many link between users and skills. Enables filtering by proficiency level (e.g. "Expert Python developers"). Replaces profiles.skills JSONB.';

-- Language master list (ISO 639-1 codes)
CREATE TABLE IF NOT EXISTS public.languages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       CHAR(2) NOT NULL UNIQUE,    -- ISO 639-1 e.g. 'en', 'es', 'zh'
  name       TEXT NOT NULL UNIQUE        -- e.g. "English", "Spanish"
);

COMMENT ON TABLE public.languages
  IS 'Master list of global languages (ISO 639-1). Admin/service-role managed.';

-- Seed core languages
INSERT INTO public.languages (code, name) VALUES
  ('en', 'English'),
  ('es', 'Spanish'),
  ('fr', 'French'),
  ('de', 'German'),
  ('zh', 'Chinese (Mandarin)'),
  ('ja', 'Japanese'),
  ('ko', 'Korean'),
  ('ar', 'Arabic'),
  ('pt', 'Portuguese'),
  ('ru', 'Russian'),
  ('hi', 'Hindi'),
  ('id', 'Indonesian'),
  ('ms', 'Malay'),
  ('th', 'Thai'),
  ('vi', 'Vietnamese'),
  ('tl', 'Filipino')
ON CONFLICT (code) DO NOTHING;

-- Enum for language fluency levels
DO $$ BEGIN
  CREATE TYPE public.fluency_level AS ENUM ('basic', 'conversational', 'fluent', 'native');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_languages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language_id   UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  fluency_level public.fluency_level NOT NULL DEFAULT 'conversational',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language_id)
);

COMMENT ON TABLE public.user_languages
  IS 'Languages a user speaks with their fluency level. Essential for matching international Clients.';


-- =============================================================================
-- DOMAIN 5: Work & Reputation
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_experiences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  title        TEXT NOT NULL,
  location     TEXT,
  is_remote    BOOLEAN DEFAULT FALSE,
  description  TEXT,
  start_date   DATE NOT NULL,
  end_date     DATE,
  is_current   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_portfolios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  url          TEXT,
  image_url    TEXT,
  tags         TEXT[] DEFAULT '{}',
  position     SMALLINT DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_portfolios
  IS 'Links and images of a user''s completed past projects. Visual proof of quality for Freelancer/Consultant vetting.';

-- One row per user — the "social credit" score, maintained by triggers/backend
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_earnings   NUMERIC(12, 2) DEFAULT 0,
  avg_rating       NUMERIC(3, 2) DEFAULT 0,    -- 0.00 to 5.00
  total_reviews    INTEGER DEFAULT 0,
  jobs_completed   INTEGER DEFAULT 0,
  jobs_in_progress INTEGER DEFAULT 0,
  response_rate    NUMERIC(5, 2) DEFAULT 0,    -- Percentage 0-100
  on_time_rate     NUMERIC(5, 2) DEFAULT 0,    -- Percentage 0-100
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_stats
  IS 'Aggregated career statistics per user. Read-only for other users (public profile). Written only by backend/service role. Initialized lazily on first project completion.';


-- =============================================================================
-- DOMAIN 6: Financial & Niche
-- =============================================================================

-- Enum for specialization categories
DO $$ BEGIN
  CREATE TYPE public.specialization_category AS ENUM (
    'fintech', 'healthcare', 'e_commerce', 'saas', 'education', 'real_estate',
    'legal', 'marketing', 'logistics', 'media', 'gaming', 'ai_ml',
    'cybersecurity', 'blockchain', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_specializations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category            public.specialization_category NOT NULL,
  sub_category        TEXT,
  years_of_experience SMALLINT,
  description         TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

COMMENT ON TABLE public.user_specializations
  IS 'Industry niches a user specialises in. Used for Admin-assisted matchmaking between Consultants and client project categories.';

-- Enum for availability status
DO $$ BEGIN
  CREATE TYPE public.availability_status AS ENUM ('available', 'partially_available', 'unavailable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- One row per user — rate card
CREATE TABLE IF NOT EXISTS public.user_rate_settings (
  user_id            UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  hourly_rate        NUMERIC(10, 2),
  currency           CHAR(3) DEFAULT 'USD',  -- ISO 4217
  min_project_budget NUMERIC(10, 2),
  availability       public.availability_status DEFAULT 'available',
  weekly_hours       SMALLINT,               -- Max hours/week available
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_rate_settings
  IS 'Freelancer/Consultant rate card. Used for budget matching during project kickoff. One row per user.';


-- =============================================================================
-- DATA MIGRATION: profiles.skills JSONB → user_skills
-- =============================================================================

-- Migrate any existing JSONB skill names to the user_skills join table
-- Matches by name (case-insensitive) against the skills master table
INSERT INTO public.user_skills (user_id, skill_id, proficiency_level)
SELECT
  p.id      AS user_id,
  s.id      AS skill_id,
  'intermediate'::public.proficiency_level
FROM public.profiles p
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN p.skills IS NULL OR p.skills = 'null'::jsonb OR jsonb_typeof(p.skills) != 'array' THEN '[]'::jsonb
    ELSE p.skills
  END
) AS skill_name
JOIN public.skills s ON LOWER(s.name) = LOWER(skill_name)
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- Drop the now-redundant JSONB column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS skills;


-- =============================================================================
-- UPDATED_AT TRIGGERS (reuse existing function)
-- =============================================================================

CREATE OR REPLACE TRIGGER update_user_verifications_updated_at
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_identity_documents_updated_at
  BEFORE UPDATE ON public.user_identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_educations_updated_at
  BEFORE UPDATE ON public.user_educations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_certifications_updated_at
  BEFORE UPDATE ON public.user_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_licenses_updated_at
  BEFORE UPDATE ON public.user_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_experiences_updated_at
  BEFORE UPDATE ON public.user_experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_portfolios_updated_at
  BEFORE UPDATE ON public.user_portfolios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_specializations_updated_at
  BEFORE UPDATE ON public.user_specializations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_rate_settings_updated_at
  BEFORE UPDATE ON public.user_rate_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =============================================================================
-- INDEXES
-- =============================================================================

-- user_verifications
CREATE INDEX IF NOT EXISTS idx_user_verifications_user ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);

-- user_identity_documents
CREATE INDEX IF NOT EXISTS idx_user_identity_docs_user ON public.user_identity_documents(user_id);

-- user_educations
CREATE INDEX IF NOT EXISTS idx_user_educations_user ON public.user_educations(user_id);

-- user_certifications
CREATE INDEX IF NOT EXISTS idx_user_certifications_user ON public.user_certifications(user_id);

-- user_licenses
CREATE INDEX IF NOT EXISTS idx_user_licenses_user ON public.user_licenses(user_id);

-- user_skills
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON public.user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_proficiency ON public.user_skills(proficiency_level);

-- user_languages
CREATE INDEX IF NOT EXISTS idx_user_languages_user ON public.user_languages(user_id);

-- user_experiences
CREATE INDEX IF NOT EXISTS idx_user_experiences_user ON public.user_experiences(user_id);

-- user_portfolios
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user ON public.user_portfolios(user_id);

-- user_specializations
CREATE INDEX IF NOT EXISTS idx_user_specializations_user ON public.user_specializations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_specializations_category ON public.user_specializations(category);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Helper inline: is the current user an admin?
-- (reuses the existing pattern from other policies in this DB)

-- Enable RLS on all new tables
ALTER TABLE public.user_verifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_educations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_licenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_languages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experiences        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_specializations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rate_settings      ENABLE ROW LEVEL SECURITY;

-- ─── languages ────────────────────────────────────────────────────────────────
-- Public read (needed for profile forms); service role only for writes
CREATE POLICY "languages: public read"
  ON public.languages FOR SELECT USING (true);

-- ─── user_verifications ───────────────────────────────────────────────────────
CREATE POLICY "user_verifications: owner read"
  ON public.user_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_verifications: admin read"
  ON public.user_verifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND active_persona = 'admin'::public.persona_type
  ));

-- Only admins can insert/update verifications (it's a gatekeeping record)
CREATE POLICY "user_verifications: admin write"
  ON public.user_verifications FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND active_persona = 'admin'::public.persona_type
  ));

-- ─── user_identity_documents ─────────────────────────────────────────────────
CREATE POLICY "user_identity_documents: owner read"
  ON public.user_identity_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_identity_documents: owner insert"
  ON public.user_identity_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_identity_documents: owner delete"
  ON public.user_identity_documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "user_identity_documents: admin all"
  ON public.user_identity_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND active_persona = 'admin'::public.persona_type
  ));

-- ─── user_educations ─────────────────────────────────────────────────────────
CREATE POLICY "user_educations: public read"
  ON public.user_educations FOR SELECT USING (true);

CREATE POLICY "user_educations: owner write"
  ON public.user_educations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_certifications ─────────────────────────────────────────────────────
CREATE POLICY "user_certifications: public read"
  ON public.user_certifications FOR SELECT USING (true);

CREATE POLICY "user_certifications: owner write"
  ON public.user_certifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_licenses ───────────────────────────────────────────────────────────
CREATE POLICY "user_licenses: public read"
  ON public.user_licenses FOR SELECT USING (true);

CREATE POLICY "user_licenses: owner write"
  ON public.user_licenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_skills ─────────────────────────────────────────────────────────────
CREATE POLICY "user_skills: public read"
  ON public.user_skills FOR SELECT USING (true);

CREATE POLICY "user_skills: owner write"
  ON public.user_skills FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_languages ──────────────────────────────────────────────────────────
CREATE POLICY "user_languages: public read"
  ON public.user_languages FOR SELECT USING (true);

CREATE POLICY "user_languages: owner write"
  ON public.user_languages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_experiences ────────────────────────────────────────────────────────
CREATE POLICY "user_experiences: public read"
  ON public.user_experiences FOR SELECT USING (true);

CREATE POLICY "user_experiences: owner write"
  ON public.user_experiences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_portfolios ─────────────────────────────────────────────────────────
CREATE POLICY "user_portfolios: public read"
  ON public.user_portfolios FOR SELECT USING (true);

CREATE POLICY "user_portfolios: owner write"
  ON public.user_portfolios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_stats ──────────────────────────────────────────────────────────────
-- Authenticated users can read anyone's stats (public profile pages)
CREATE POLICY "user_stats: authenticated read"
  ON public.user_stats FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can write stats (maintained by backend triggers)
-- (no INSERT/UPDATE/DELETE policy = only service role can write)

-- ─── user_specializations ────────────────────────────────────────────────────
CREATE POLICY "user_specializations: public read"
  ON public.user_specializations FOR SELECT USING (true);

CREATE POLICY "user_specializations: owner write"
  ON public.user_specializations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_rate_settings ──────────────────────────────────────────────────────
CREATE POLICY "user_rate_settings: public read"
  ON public.user_rate_settings FOR SELECT USING (true);

CREATE POLICY "user_rate_settings: owner write"
  ON public.user_rate_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
