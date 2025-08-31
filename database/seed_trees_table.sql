-- ===================================================
-- SEED TREES TABLE WITH ALL TREE TYPES
-- ===================================================
-- Populates the trees table with comprehensive tree data
-- This will enable the "Plant New Tree" modal to work properly
-- ===================================================

-- Insert all tree types with complete data
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
('AS', 'Apple Star', 'Tropical tree with star-shaped fruits', 'exotic', 'year-round', 3, 'small')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  season = EXCLUDED.season,
  years_to_fruit = EXCLUDED.years_to_fruit,
  mature_height = EXCLUDED.mature_height,
  updated_at = NOW();

-- Verify trees were inserted
SELECT 
    'TREES TABLE SEEDED SUCCESSFULLY!' as status,
    COUNT(*) as total_trees,
    COUNT(DISTINCT category) as categories,
    COUNT(DISTINCT season) as seasons
FROM trees;

-- Show sample of inserted trees
SELECT 
    'SAMPLE TREE TYPES:' as info,
    code,
    name,
    category,
    season,
    years_to_fruit,
    mature_height
FROM trees
ORDER BY category, name
LIMIT 10;

-- Show trees by category
SELECT 
    'TREES BY CATEGORY:' as summary,
    category,
    COUNT(*) as tree_count,
    STRING_AGG(name, ', ' ORDER BY name) as tree_names
FROM trees
WHERE category IS NOT NULL
GROUP BY category
ORDER BY category;
