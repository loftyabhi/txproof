-- Migration: Enterprise Contributions (Soft Invalidation)
-- Description: Adds columns to support soft invalidation of contribution records instead of hard deletion.

ALTER TABLE contributor_events 
ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS invalid_reason TEXT,
ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contrib_valid ON contributor_events(is_valid);
