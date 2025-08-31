-- Update Tree Table Schema - Convert to Type-Based Fields
-- This migration changes tree fields from instance-based to type-based
-- Run this migration to update the trees table structure

-- Start transaction
BEGIN;

-- 1. Add new type-based columns
ALTER TABLE trees 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS season VARCHAR(50),
  ADD COLUMN IF NOT EXISTS years_to_fruit INTEGER,
  ADD COLUMN IF NOT EXISTS mature_height VARCHAR(50);

-- 2. Remove instance-based columns that belong to tree_positions
-- Note: Be careful with this step - ensure no important data will be lost
ALTER TABLE trees 
  DROP COLUMN IF EXISTS scientific_name,
  DROP COLUMN IF EXISTS planting_date,
  DROP COLUMN IF EXISTS expected_harvest_date,
  DROP COLUMN IF EXISTS status;

-- 3. Create indexes for new fields (for better search performance)
CREATE INDEX IF NOT EXISTS idx_trees_category ON trees(category);
CREATE INDEX IF NOT EXISTS idx_trees_season ON trees(season);
CREATE INDEX IF NOT EXISTS idx_trees_mature_height ON trees(mature_height);

-- 4. Update existing tree records with default values based on predefined types
-- This ensures existing trees get proper categorization

UPDATE trees SET 
  category = 'tropical',
  season = 'summer',
  years_to_fruit = 3,
  mature_height = 'large'
WHERE code = 'M' AND category IS NULL;

UPDATE trees SET 
  category = 'citrus',
  season = 'year-round',
  years_to_fruit = 2,
  mature_height = 'medium'
WHERE code = 'L' AND category IS NULL;

UPDATE trees SET 
  category = 'exotic',
  season = 'year-round',
  years_to_fruit = 4,
  mature_height = 'medium'
WHERE code = 'AS' AND category IS NULL;

UPDATE trees SET 
  category = 'stone',
  season = 'winter',
  years_to_fruit = 3,
  mature_height = 'medium'
WHERE code = 'A' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'winter',
  years_to_fruit = 3,
  mature_height = 'medium'
WHERE code = 'CA' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'year-round',
  years_to_fruit = 2,
  mature_height = 'medium'
WHERE code = 'G' AND category IS NULL;

UPDATE trees SET 
  category = 'stone',
  season = 'summer',
  years_to_fruit = 3,
  mature_height = 'medium'
WHERE code = 'AN' AND category IS NULL;

UPDATE trees SET 
  category = 'stone',
  season = 'winter',
  years_to_fruit = 3,
  mature_height = 'medium'
WHERE code = 'P' AND category IS NULL;

UPDATE trees SET 
  category = 'berry',
  season = 'summer',
  years_to_fruit = 2,
  mature_height = 'large'
WHERE code = 'MB' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'summer',
  years_to_fruit = 5,
  mature_height = 'large'
WHERE code = 'JA' AND category IS NULL;

UPDATE trees SET 
  category = 'berry',
  season = 'year-round',
  years_to_fruit = 2,
  mature_height = 'small'
WHERE code = 'BC' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'year-round',
  years_to_fruit = 4,
  mature_height = 'large'
WHERE code = 'AV' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'year-round',
  years_to_fruit = 3,
  mature_height = 'medium'
WHERE code = 'SF' AND category IS NULL;

UPDATE trees SET 
  category = 'nut',
  season = 'summer',
  years_to_fruit = 5,
  mature_height = 'large'
WHERE code = 'C' AND category IS NULL;

UPDATE trees SET 
  category = 'stone',
  season = 'winter',
  years_to_fruit = 3,
  mature_height = 'medium'
WHERE code = 'PR' AND category IS NULL;

UPDATE trees SET 
  category = 'stone',
  season = 'summer',
  years_to_fruit = 3,
  mature_height = 'medium'
WHERE code = 'PC' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'year-round',
  years_to_fruit = 4,
  mature_height = 'large'
WHERE code = 'SP' AND category IS NULL;

UPDATE trees SET 
  category = 'exotic',
  season = 'year-round',
  years_to_fruit = 1,
  mature_height = 'medium'
WHERE code = 'MR' AND category IS NULL;

UPDATE trees SET 
  category = 'berry',
  season = 'summer',
  years_to_fruit = 2,
  mature_height = 'small'
WHERE code = 'BB' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'summer',
  years_to_fruit = 5,
  mature_height = 'large'
WHERE code = 'LC' AND category IS NULL;

UPDATE trees SET 
  category = 'exotic',
  season = 'year-round',
  years_to_fruit = 3,
  mature_height = 'small'
WHERE code = 'MF' AND category IS NULL;

UPDATE trees SET 
  category = 'berry',
  season = 'summer',
  years_to_fruit = 2,
  mature_height = 'small'
WHERE code = 'KR' AND category IS NULL;

UPDATE trees SET 
  category = 'stone',
  season = 'winter',
  years_to_fruit = 3,
  mature_height = 'medium'
WHERE code = 'AB' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'year-round',
  years_to_fruit = 1,
  mature_height = 'medium'
WHERE code = 'BA' AND category IS NULL;

UPDATE trees SET 
  category = 'tropical',
  season = 'year-round',
  years_to_fruit = 1,
  mature_height = 'medium'
WHERE code = 'PA' AND category IS NULL;

UPDATE trees SET 
  category = 'berry',
  season = 'summer',
  years_to_fruit = 2,
  mature_height = 'medium'
WHERE code = 'GR' AND category IS NULL;

-- 5. Add constraints for valid values (optional but recommended)
ALTER TABLE trees 
  ADD CONSTRAINT check_category 
  CHECK (category IN ('citrus', 'stone', 'tropical', 'berry', 'nut', 'exotic'));

ALTER TABLE trees 
  ADD CONSTRAINT check_season 
  CHECK (season IN ('summer', 'winter', 'monsoon', 'year-round'));

ALTER TABLE trees 
  ADD CONSTRAINT check_mature_height 
  CHECK (mature_height IN ('small', 'medium', 'large'));

ALTER TABLE trees 
  ADD CONSTRAINT check_years_to_fruit 
  CHECK (years_to_fruit > 0 AND years_to_fruit <= 20);

-- 6. Create/update trigger to automatically update the updated_at column
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

-- Commit transaction
COMMIT;

-- 7. Verification queries (run these to check the migration worked)
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'trees' ORDER BY ordinal_position;
-- SELECT code, name, category, season, years_to_fruit, mature_height FROM trees LIMIT 10;

