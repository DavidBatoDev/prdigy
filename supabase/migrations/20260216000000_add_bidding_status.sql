-- Add 'bidding' status to project_status enum
-- Migration: 20260216000000_add_bidding_status.sql
-- Date: February 16, 2026
-- Description: Adds 'bidding' status for projects that are open for consultant bids

-- Add new value to project_status enum
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'bidding';

-- Add comment
COMMENT ON TYPE project_status IS 'Project lifecycle status: draft (initial), bidding (open for consultant bids), active (in progress), paused (temporarily stopped), completed (finished), archived (historical)';
