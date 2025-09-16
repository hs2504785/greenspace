-- Add custom node types storage for farm layouts
-- This allows users to customize node types at specific grid positions
-- Safe for both new installations and existing databases

BEGIN;

-- Create table to store custom node type configurations (if it doesn't exist)
CREATE TABLE IF NOT EXISTS custom_node_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  layout_id UUID REFERENCES farm_layouts(id) ON DELETE CASCADE,
  block_index INTEGER NOT NULL DEFAULT 0,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  node_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(layout_id, block_index, grid_x, grid_y)
);

-- Update constraint to include 'default' type (safe for existing tables)
-- Drop existing constraint if it exists
ALTER TABLE custom_node_types DROP CONSTRAINT IF EXISTS custom_node_types_node_type_check;

-- Add updated constraint that includes 'default'
ALTER TABLE custom_node_types 
ADD CONSTRAINT custom_node_types_node_type_check 
CHECK (node_type IN ('big', 'centerBig', 'medium', 'small', 'tiny', 'default'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_node_types_layout_id ON custom_node_types(layout_id);
CREATE INDEX IF NOT EXISTS idx_custom_node_types_coordinates ON custom_node_types(block_index, grid_x, grid_y);
CREATE INDEX IF NOT EXISTS idx_custom_node_types_type ON custom_node_types(node_type);

-- Add trigger to update updated_at timestamp (safe for existing databases)
CREATE OR REPLACE FUNCTION update_custom_node_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_custom_node_types_updated_at ON custom_node_types;
CREATE TRIGGER update_custom_node_types_updated_at
    BEFORE UPDATE ON custom_node_types
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_node_types_updated_at();

COMMIT;
