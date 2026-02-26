-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: grant super_admin to accounts@prodigitality.net
-- User ID: 47eb77d7-c209-4ebf-bc2d-8c362a8c2efb
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.admin_profiles (user_id, access_level, department, is_active)
VALUES (
  '47eb77d7-c209-4ebf-bc2d-8c362a8c2efb',
  'super_admin',
  'Platform',
  true
)
ON CONFLICT (user_id) DO UPDATE
  SET access_level = 'super_admin',
      department   = 'Platform',
      is_active    = true;
