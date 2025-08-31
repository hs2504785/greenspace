-- ===================================================
-- PRODUCTION-SAFE TREE MANAGEMENT SYSTEM MIGRATION
-- ===================================================
-- This script creates tree management tables without hardcoded user IDs
-- Safe for production deployment

-- Trees Table - Main tree information
CREATE TABLE IF NOT EXISTS trees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  scientific_name VARCHAR(255),
  variety VARCHAR(255),
  description TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  status VARCHAR(50) DEFAULT 'healthy',
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

-- Tree Positions Table - Store tree positions in the grid
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

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_trees_code ON trees(code);
CREATE INDEX IF NOT EXISTS idx_trees_farm_id ON trees(farm_id);
CREATE INDEX IF NOT EXISTS idx_tree_positions_layout_id ON tree_positions(layout_id);
CREATE INDEX IF NOT EXISTS idx_tree_positions_coordinates ON tree_positions(grid_x, grid_y);
CREATE INDEX IF NOT EXISTS idx_tree_care_logs_tree_id ON tree_care_logs(tree_id);

-- Insert initial tree types/codes (safe - no user dependencies)
INSERT INTO trees (code, name, scientific_name, description) VALUES
('M', 'Mango', 'Mangifera indica', 'Tropical fruit tree known for sweet, juicy fruits'),
('L', 'Lemon', 'Citrus limon', 'Citrus tree producing acidic yellow fruits'),
('P', 'Pomegranate', 'Punica granatum', 'Fruit tree with red, seed-filled fruits'),
('G', 'Guava', 'Psidium guajava', 'Tropical tree with fragrant, sweet fruits'),
('AN', 'Anjeer', 'Ficus carica', 'Fig tree producing sweet, purple or green fruits'),
('CA', 'Custard Apple', 'Annona squamosa', 'Tropical tree with sweet, creamy fruits'),
('A', 'Apple', 'Malus domestica', 'Temperate fruit tree with crisp, sweet fruits'),
('MB', 'Mulberry', 'Morus nigra', 'Tree producing dark purple berries'),
('PR', 'Pear', 'Pyrus communis', 'Fruit tree with sweet, bell-shaped fruits'),
('JA', 'Jackfruit', 'Artocarpus heterophyllus', 'Large tropical fruit tree'),
('MU', 'Musambi', 'Citrus limetta', 'Sweet lime citrus tree'),
('O', 'Orange', 'Citrus sinensis', 'Popular citrus tree with sweet fruits'),
('BC', 'Barbados Cherry', 'Malpighia emarginata', 'Small tree with vitamin C rich fruits'),
('AV', 'Avocado', 'Persea americana', 'Tree producing nutrient-rich green fruits'),
('SF', 'Starfruit', 'Averrhoa carambola', 'Tree with star-shaped yellow fruits'),
('C', 'Cashew', 'Anacardium occidentale', 'Tree producing cashew nuts'),
('AM', 'Amla', 'Phyllanthus emblica', 'Tree with vitamin C rich sour fruits'),
('MR', 'Moringa', 'Moringa oleifera', 'Nutritious tree with edible leaves'),
('SL', 'Sapota/Chiku', 'Manilkara zapota', 'Tree with sweet, brown fruits'),
('KR', 'Karonda', 'Carissa carandas', 'Small tree with tart berries'),
('BA', 'Banana', 'Musa acuminata', 'Large herbaceous plant with sweet fruits'),
('PA', 'Papaya', 'Carica papaya', 'Fast-growing tree with orange fruits'),
('GR', 'Grapes', 'Vitis vinifera', 'Vine producing clusters of sweet fruits'),
('BB', 'Blueberry', 'Vaccinium corymbosum', 'Small shrub with antioxidant-rich berries'),
('LC', 'Litchi', 'Litchi chinensis', 'Tropical tree with sweet, fragrant fruits'),
('MF', 'Monk Fruit', 'Siraitia grosvenorii', 'Small vine with natural sweetener fruits'),
('AB', 'Apricot', 'Prunus armeniaca', 'Stone fruit tree with orange, velvety fruits'),
('PC', 'Peach', 'Prunus persica', 'Stone fruit tree with fuzzy, sweet fruits'),
('SP', 'Sapodilla', 'Manilkara zapota', 'Tropical tree with brown, sweet fruits'),
('AS', 'Apple Star', 'Chrysophyllum cainito', 'Tropical tree with star-shaped fruits')
ON CONFLICT (code) DO NOTHING;

-- ===================================================
-- IMPORTANT: MANUAL STEP REQUIRED AFTER MIGRATION
-- ===================================================
-- After running this script, you need to create a default farm layout
-- for your admin/superadmin user. Run this query with your actual user ID:

-- Step 1: Find your admin user ID
-- SELECT id, email, role FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1;

-- Step 2: Create default farm layout (replace YOUR_USER_ID with actual ID)
-- INSERT INTO farm_layouts (farm_id, name, description, grid_config) 
-- VALUES (
--   'YOUR_USER_ID'::uuid, 
--   'Default Farm Layout - 5x3 Grid', 
--   '15-block layout (5x3 grid of 24x24 blocks)',
--   '{
--     "blocks": [
--       {"x": 0, "y": 0, "width": 24, "height": 24},
--       {"x": 24, "y": 0, "width": 24, "height": 24},
--       {"x": 48, "y": 0, "width": 24, "height": 24},
--       {"x": 72, "y": 0, "width": 24, "height": 24},
--       {"x": 96, "y": 0, "width": 24, "height": 24},
--       {"x": 0, "y": 24, "width": 24, "height": 24},
--       {"x": 24, "y": 24, "width": 24, "height": 24},
--       {"x": 48, "y": 24, "width": 24, "height": 24},
--       {"x": 72, "y": 24, "width": 24, "height": 24},
--       {"x": 96, "y": 24, "width": 24, "height": 24},
--       {"x": 0, "y": 48, "width": 24, "height": 24},
--       {"x": 24, "y": 48, "width": 24, "height": 24},
--       {"x": 48, "y": 48, "width": 24, "height": 24},
--       {"x": 72, "y": 48, "width": 24, "height": 24},
--       {"x": 96, "y": 48, "width": 24, "height": 24}
--     ]
--   }'::jsonb
-- );

-- Success message
SELECT 'Tree management tables created successfully! Remember to create a farm layout for your admin user.' as status;
