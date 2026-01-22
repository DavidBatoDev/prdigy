-- Roadmap Canvas Schema v2.0 Upgrade
-- Migration: 20260121000000_upgrade_roadmap_to_v2.sql
-- Date: January 21, 2026
-- Description: Upgrades roadmap schema to v2.0 - changes milestone tracking from epics to features
--
-- Breaking Change: Milestones now link to Features, not Epics
-- Rationale: Features are the smallest deliverable unit, enabling accurate progress tracking
--            and partial epic delivery across milestones

-- ============================================================================
-- STEP 1: DROP OLD JUNCTION TABLE
-- ============================================================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_milestone_epics_milestone_id;
DROP INDEX IF EXISTS idx_milestone_epics_epic_id;

-- Drop the milestone_epics table
DROP TABLE IF EXISTS milestone_epics;

-- ============================================================================
-- STEP 2: ADD NEW COLUMNS TO roadmap_features
-- ============================================================================

-- Add roadmap_id for performance (denormalized)
ALTER TABLE roadmap_features
ADD COLUMN roadmap_id UUID;

-- Backfill roadmap_id from epic_id
UPDATE roadmap_features
SET roadmap_id = (
  SELECT roadmap_id 
  FROM roadmap_epics 
  WHERE id = roadmap_features.epic_id
);

-- Make roadmap_id NOT NULL and add FK constraint
ALTER TABLE roadmap_features
ALTER COLUMN roadmap_id SET NOT NULL,
ADD CONSTRAINT fk_roadmap_features_roadmap
  FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE;

-- Add is_deliverable flag
ALTER TABLE roadmap_features
ADD COLUMN is_deliverable BOOLEAN DEFAULT true NOT NULL;

-- ============================================================================
-- STEP 3: CREATE NEW milestone_features JUNCTION TABLE
-- ============================================================================

CREATE TABLE milestone_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES roadmap_features(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(milestone_id, feature_id)
);

-- Add indexes
CREATE INDEX idx_milestone_features_milestone_id ON milestone_features(milestone_id);
CREATE INDEX idx_milestone_features_feature_id ON milestone_features(feature_id);

-- Add comment
COMMENT ON TABLE milestone_features IS 'Many-to-many junction table linking milestones to features (key table for delivery tracking)';

-- ============================================================================
-- STEP 4: ADD NEW INDEXES FOR roadmap_features
-- ============================================================================

CREATE INDEX idx_roadmap_features_roadmap_id ON roadmap_features(roadmap_id);
CREATE INDEX idx_roadmap_features_is_deliverable ON roadmap_features(is_deliverable) 
  WHERE is_deliverable = true;

-- ============================================================================
-- STEP 5: UPDATE PROGRESS CALCULATION FUNCTIONS
-- ============================================================================

-- Update milestone progress to calculate from features (KEY CHANGE)
CREATE OR REPLACE FUNCTION get_milestone_progress(p_milestone_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT AVG(get_feature_progress(feature_id))
     FROM milestone_features
     WHERE milestone_id = p_milestone_id),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 6: UPDATE RLS POLICIES FOR NEW TABLE
-- ============================================================================

-- Enable RLS on milestone_features
ALTER TABLE milestone_features ENABLE ROW LEVEL SECURITY;

-- Milestone features: All operations via roadmap access
CREATE POLICY milestone_features_all ON milestone_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM roadmap_features f
      WHERE f.id = feature_id
      AND can_access_roadmap(f.roadmap_id, auth.uid())
    )
  );

-- Update roadmap_features RLS to use roadmap_id directly
DROP POLICY IF EXISTS roadmap_features_all ON roadmap_features;

CREATE POLICY roadmap_features_all ON roadmap_features
  FOR ALL USING (can_access_roadmap(roadmap_id, auth.uid()));

-- ============================================================================
-- STEP 7: UPDATE TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE roadmap_features IS 'The smallest deliverable unit within an epic. Features are the key unit for milestone tracking.';
COMMENT ON COLUMN roadmap_features.roadmap_id IS 'Denormalized for performance - avoids deep joins in queries and RLS policies';
COMMENT ON COLUMN roadmap_features.is_deliverable IS 'Whether this feature counts toward milestone progress (excludes refactors, infra work)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Removed milestone_epics table
-- ✅ Added milestone_features table
-- ✅ Added roadmap_id to roadmap_features (denormalized)
-- ✅ Added is_deliverable to roadmap_features
-- ✅ Updated get_milestone_progress() to calculate from features
-- ✅ Added appropriate indexes
-- ✅ Updated RLS policies
-- ✅ Added documentation comments
