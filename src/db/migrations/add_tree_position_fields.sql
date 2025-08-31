-- Add missing fields to tree_positions table for individual tree instance data
-- This migration adds fields that should be specific to each planted tree instance

BEGIN;

-- Add variety field for specific tree varieties (e.g., Alphonso mango, Granny Smith apple)
ALTER TABLE tree_positions 
  ADD COLUMN IF NOT EXISTS variety VARCHAR(255);

-- Add status field for health/growth status of this specific tree
ALTER TABLE tree_positions 
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'healthy';

-- Add planting_date for when this specific tree was planted
ALTER TABLE tree_positions 
  ADD COLUMN IF NOT EXISTS planting_date DATE;

-- Add notes field for tree-specific notes
ALTER TABLE tree_positions 
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add updated_at timestamp for tracking changes
ALTER TABLE tree_positions 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tree_positions_status ON tree_positions(status);
CREATE INDEX IF NOT EXISTS idx_tree_positions_variety ON tree_positions(variety);
CREATE INDEX IF NOT EXISTS idx_tree_positions_planting_date ON tree_positions(planting_date);

-- Update existing records to have default values
UPDATE tree_positions 
SET 
  status = 'healthy',
  planting_date = planted_at::date,
  updated_at = planted_at
WHERE status IS NULL OR planting_date IS NULL;

COMMIT;
