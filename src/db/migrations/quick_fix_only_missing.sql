-- Quick Fix: Only add missing pieces for tree management
-- This script safely adds only what doesn't exist

-- Create missing tables (safe if they exist)
CREATE TABLE IF NOT EXISTS farm_layouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farm_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  grid_config JSONB NOT NULL DEFAULT '{"blocks": [{"x": 0, "y": 0, "width": 24, "height": 24}]}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS tree_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tree_id UUID REFERENCES trees(id) ON DELETE CASCADE,
  layout_id UUID REFERENCES farm_layouts(id) ON DELETE CASCADE,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  block_index INTEGER NOT NULL DEFAULT 0,
  planted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(layout_id, grid_x, grid_y, block_index)
);

CREATE TABLE IF NOT EXISTS tree_care_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tree_id UUID REFERENCES trees(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  notes TEXT,
  images TEXT[]
);

-- Add missing columns to trees table if needed (safe approach)
DO $$ 
BEGIN
    -- Add farm_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trees' AND column_name = 'farm_id') THEN
        ALTER TABLE trees ADD COLUMN farm_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add other columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trees' AND column_name = 'status') THEN
        ALTER TABLE trees ADD COLUMN status VARCHAR(50) DEFAULT 'healthy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trees' AND column_name = 'planting_date') THEN
        ALTER TABLE trees ADD COLUMN planting_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trees' AND column_name = 'expected_harvest_date') THEN
        ALTER TABLE trees ADD COLUMN expected_harvest_date DATE;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_trees_farm_id ON trees(farm_id);
CREATE INDEX IF NOT EXISTS idx_tree_positions_layout_id ON tree_positions(layout_id);
CREATE INDEX IF NOT EXISTS idx_tree_positions_coordinates ON tree_positions(grid_x, grid_y);
CREATE INDEX IF NOT EXISTS idx_tree_care_logs_tree_id ON tree_care_logs(tree_id);

-- Use your existing superadmin user for farm layout (no need to create new user)
-- Create default farm layout if none exists for your existing user
INSERT INTO farm_layouts (farm_id, name, description, grid_config) 
SELECT '0e13a58b-a5e2-4ed3-9c69-9634c7413550'::uuid, 'Default Farm Layout', 'Initial 8-block layout (2x4 grid of 24x24 blocks)', 
'{"blocks": [
   {"x": 0, "y": 0, "width": 24, "height": 24},
   {"x": 24, "y": 0, "width": 24, "height": 24},
   {"x": 0, "y": 24, "width": 24, "height": 24},
   {"x": 24, "y": 24, "width": 24, "height": 24},
   {"x": 0, "y": 48, "width": 24, "height": 24},
   {"x": 24, "y": 48, "width": 24, "height": 24},
   {"x": 0, "y": 72, "width": 24, "height": 24},
   {"x": 24, "y": 72, "width": 24, "height": 24}
 ]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM farm_layouts WHERE farm_id = '0e13a58b-a5e2-4ed3-9c69-9634c7413550'::uuid);
