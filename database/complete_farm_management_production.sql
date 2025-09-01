-- ===================================================
-- COMPLETE FARM MANAGEMENT SYSTEM - PRODUCTION DEPLOYMENT
-- ===================================================
-- Single script to deploy entire farm management system
-- Run this once on production database
-- ===================================================

-- Start transaction for safety
BEGIN;

-- ===================================================
-- STEP 1: CREATE FARM MANAGEMENT TABLES
-- ===================================================

-- Trees Table - Main tree information with type-based fields
CREATE TABLE IF NOT EXISTS trees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  description TEXT,
  category VARCHAR(50),
  season VARCHAR(50),
  years_to_fruit INTEGER,
  mature_height VARCHAR(50),
  farm_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Farm Layouts Table - Store grid layout configurations
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

-- Tree Positions Table - Store tree positions in the grid with instance data
CREATE TABLE IF NOT EXISTS tree_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tree_id UUID REFERENCES trees(id) ON DELETE CASCADE,
  layout_id UUID REFERENCES farm_layouts(id) ON DELETE CASCADE,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  block_index INTEGER NOT NULL DEFAULT 0,
  variety VARCHAR(255),
  status VARCHAR(50) DEFAULT 'healthy',
  planting_date DATE,
  notes TEXT,
  planted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(layout_id, grid_x, grid_y, block_index)
);

-- Tree Care Logs Table - Track maintenance activities
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

-- ===================================================
-- STEP 2: CREATE PERFORMANCE INDEXES
-- ===================================================

-- Trees table indexes
CREATE INDEX IF NOT EXISTS idx_trees_code ON trees(code);
CREATE INDEX IF NOT EXISTS idx_trees_farm_id ON trees(farm_id);
CREATE INDEX IF NOT EXISTS idx_trees_category ON trees(category);
CREATE INDEX IF NOT EXISTS idx_trees_season ON trees(season);
CREATE INDEX IF NOT EXISTS idx_trees_mature_height ON trees(mature_height);

-- Farm layouts indexes
CREATE INDEX IF NOT EXISTS idx_farm_layouts_farm_id ON farm_layouts(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_layouts_is_active ON farm_layouts(is_active);

-- Tree positions indexes
CREATE INDEX IF NOT EXISTS idx_tree_positions_layout_id ON tree_positions(layout_id);
CREATE INDEX IF NOT EXISTS idx_tree_positions_coordinates ON tree_positions(grid_x, grid_y);
CREATE INDEX IF NOT EXISTS idx_tree_positions_status ON tree_positions(status);
CREATE INDEX IF NOT EXISTS idx_tree_positions_variety ON tree_positions(variety);
CREATE INDEX IF NOT EXISTS idx_tree_positions_planting_date ON tree_positions(planting_date);

-- Tree care logs indexes
CREATE INDEX IF NOT EXISTS idx_tree_care_logs_tree_id ON tree_care_logs(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_care_logs_performed_by ON tree_care_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_tree_care_logs_performed_at ON tree_care_logs(performed_at);

-- ===================================================
-- STEP 3: ADD CONSTRAINTS FOR DATA INTEGRITY
-- ===================================================

-- Tree category constraints (including spices)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_category') THEN
    ALTER TABLE trees ADD CONSTRAINT check_category 
    CHECK (category IN ('citrus', 'stone', 'tropical', 'berry', 'nut', 'exotic', 'spices', 'herbs', 'medicinal'));
  END IF;
END $$;

-- Tree season constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_season') THEN
    ALTER TABLE trees ADD CONSTRAINT check_season 
    CHECK (season IN ('summer', 'winter', 'monsoon', 'year-round'));
  END IF;
END $$;

-- Tree mature height constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_mature_height') THEN
    ALTER TABLE trees ADD CONSTRAINT check_mature_height 
    CHECK (mature_height IN ('small', 'medium', 'large'));
  END IF;
END $$;

-- Years to fruit constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_years_to_fruit') THEN
    ALTER TABLE trees ADD CONSTRAINT check_years_to_fruit 
    CHECK (years_to_fruit > 0 AND years_to_fruit <= 20);
  END IF;
END $$;

-- ===================================================
-- STEP 4: CREATE UPDATE TRIGGERS
-- ===================================================

-- Trees update trigger
CREATE OR REPLACE FUNCTION update_trees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trees_updated_at_trigger ON trees;
CREATE TRIGGER trees_updated_at_trigger
    BEFORE UPDATE ON trees
    FOR EACH ROW
    EXECUTE FUNCTION update_trees_updated_at();

-- Tree positions update trigger
CREATE OR REPLACE FUNCTION update_tree_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tree_positions_updated_at_trigger ON tree_positions;
CREATE TRIGGER tree_positions_updated_at_trigger
    BEFORE UPDATE ON tree_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_tree_positions_updated_at();

-- ===================================================
-- STEP 5: INSERT TREE TYPES DATA
-- ===================================================

-- Insert comprehensive tree types with categories and growing data
INSERT INTO trees (code, name, description, category, season, years_to_fruit, mature_height) VALUES
('M', 'Mango', 'Tropical fruit tree known for sweet, juicy fruits', 'tropical', 'summer', 3, 'large'),
('L', 'Lemon', 'Citrus tree producing acidic yellow fruits', 'citrus', 'year-round', 2, 'medium'),
('P', 'Pomegranate', 'Fruit tree with red, seed-filled fruits', 'stone', 'winter', 3, 'medium'),
('G', 'Guava', 'Tropical tree with fragrant, sweet fruits', 'tropical', 'year-round', 2, 'medium'),
('AN', 'Anjeer', 'Fig tree producing sweet, purple or green fruits', 'stone', 'summer', 3, 'medium'),
('CA', 'Custard Apple', 'Tropical tree with sweet, creamy fruits', 'tropical', 'winter', 3, 'medium'),
('A', 'Apple', 'Temperate fruit tree with crisp, sweet fruits', 'stone', 'winter', 3, 'medium'),
('MB', 'Mulberry', 'Tree producing dark purple berries', 'berry', 'summer', 2, 'large'),
('PR', 'Pear', 'Fruit tree with sweet, bell-shaped fruits', 'stone', 'winter', 3, 'medium'),
('JA', 'Jackfruit', 'Large tropical fruit tree', 'tropical', 'summer', 5, 'large'),
('MU', 'Musambi', 'Sweet lime citrus tree', 'citrus', 'year-round', 2, 'medium'),
('O', 'Orange', 'Popular citrus tree with sweet fruits', 'citrus', 'year-round', 2, 'medium'),
('BC', 'Barbados Cherry', 'Small tree with vitamin C rich fruits', 'berry', 'year-round', 2, 'small'),
('AV', 'Avocado', 'Tree producing nutrient-rich green fruits', 'tropical', 'year-round', 4, 'large'),
('SF', 'Starfruit', 'Tree with star-shaped yellow fruits', 'tropical', 'year-round', 3, 'medium'),
('C', 'Cashew', 'Tree producing cashew nuts', 'nut', 'summer', 5, 'large'),
('AM', 'Amla', 'Tree with vitamin C rich sour fruits', 'stone', 'winter', 3, 'medium'),
('MR', 'Moringa', 'Nutritious tree with edible leaves', 'exotic', 'year-round', 1, 'medium'),
('SL', 'Sapota/Chiku', 'Tree with sweet, brown fruits', 'tropical', 'summer', 5, 'large'),
('KR', 'Karonda', 'Small tree with tart berries', 'berry', 'summer', 2, 'small'),
('BA', 'Banana', 'Large herbaceous plant with sweet fruits', 'tropical', 'year-round', 1, 'medium'),
('PA', 'Papaya', 'Fast-growing tree with orange fruits', 'tropical', 'year-round', 1, 'medium'),
('GR', 'Grapes', 'Vine producing clusters of sweet fruits', 'berry', 'summer', 2, 'medium'),
('BB', 'Blueberry', 'Small shrub with antioxidant-rich berries', 'berry', 'summer', 2, 'small'),
('LC', 'Litchi', 'Tropical tree with sweet, fragrant fruits', 'tropical', 'summer', 5, 'large'),
('MF', 'Monk Fruit', 'Small vine with natural sweetener fruits', 'exotic', 'year-round', 3, 'small'),
('AB', 'Apricot', 'Stone fruit tree with orange, velvety fruits', 'stone', 'winter', 3, 'medium'),
('PC', 'Peach', 'Stone fruit tree with fuzzy, sweet fruits', 'stone', 'summer', 3, 'medium'),
('SP', 'Sapodilla', 'Tropical tree with brown, sweet fruits', 'tropical', 'year-round', 4, 'large'),
('AS', 'All Spices', 'Collection of spice trees and aromatic plants', 'spices', 'year-round', 3, 'small')
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  season = EXCLUDED.season,
  years_to_fruit = EXCLUDED.years_to_fruit,
  mature_height = EXCLUDED.mature_height,
  description = EXCLUDED.description;

-- ===================================================
-- STEP 6: CREATE DEFAULT FARM LAYOUT FOR ADMIN USERS
-- ===================================================

-- Create default farm layout for any existing admin/superadmin users
INSERT INTO farm_layouts (farm_id, name, description, grid_config, is_active)
SELECT 
    u.id,
    'Default Farm Layout - 5x3 Grid',
    '15-block layout (5x3 grid of 24x24 blocks) for comprehensive farm management',
    '{
        "blocks": [
            {"x": 0, "y": 0, "width": 24, "height": 24},
            {"x": 24, "y": 0, "width": 24, "height": 24},
            {"x": 48, "y": 0, "width": 24, "height": 24},
            {"x": 72, "y": 0, "width": 24, "height": 24},
            {"x": 96, "y": 0, "width": 24, "height": 24},
            {"x": 0, "y": 24, "width": 24, "height": 24},
            {"x": 24, "y": 24, "width": 24, "height": 24},
            {"x": 48, "y": 24, "width": 24, "height": 24},
            {"x": 72, "y": 24, "width": 24, "height": 24},
            {"x": 96, "y": 24, "width": 24, "height": 24},
            {"x": 0, "y": 48, "width": 24, "height": 24},
            {"x": 24, "y": 48, "width": 24, "height": 24},
            {"x": 48, "y": 48, "width": 24, "height": 24},
            {"x": 72, "y": 48, "width": 24, "height": 24},
            {"x": 96, "y": 48, "width": 24, "height": 24}
        ]
    }'::jsonb,
    true
FROM users u
WHERE u.role IN ('admin', 'superadmin')
  AND NOT EXISTS (
    SELECT 1 FROM farm_layouts fl 
    WHERE fl.farm_id = u.id
  )
ORDER BY u.created_at DESC;

-- ===================================================
-- STEP 7: VERIFICATION QUERIES
-- ===================================================

-- Commit the transaction
COMMIT;

-- Show summary of what was created
SELECT 'FARM MANAGEMENT SYSTEM DEPLOYMENT COMPLETE!' as status;

-- Verify tables were created
SELECT 
    'TABLES CREATED:' as summary,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('trees', 'farm_layouts', 'tree_positions', 'tree_care_logs')
ORDER BY table_name;

-- Show tree types count
SELECT 
    'TREE TYPES LOADED:' as summary,
    COUNT(*) as total_tree_types,
    COUNT(DISTINCT category) as categories
FROM trees;

-- Show farm layouts created
SELECT 
    'FARM LAYOUTS CREATED:' as summary,
    fl.name,
    u.email as owner_email,
    u.role,
    jsonb_array_length(fl.grid_config->'blocks') as block_count
FROM farm_layouts fl
JOIN users u ON fl.farm_id = u.id
ORDER BY fl.created_at DESC;

-- Show indexes created
SELECT 
    'INDEXES CREATED:' as summary,
    COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN ('trees', 'farm_layouts', 'tree_positions', 'tree_care_logs');

SELECT 'DEPLOYMENT SUCCESSFUL - FARM MANAGEMENT SYSTEM READY!' as final_status;
