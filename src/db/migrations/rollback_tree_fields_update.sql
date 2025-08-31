-- ROLLBACK: Tree Table Schema Update
-- This migration reverts the tree table back to instance-based fields
-- ONLY run this if you need to rollback the type-based field changes

-- Start transaction
BEGIN;

-- 1. Add back instance-based columns
ALTER TABLE trees 
  ADD COLUMN IF NOT EXISTS scientific_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS planting_date DATE,
  ADD COLUMN IF NOT EXISTS expected_harvest_date DATE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'healthy';

-- 2. Remove type-based columns
ALTER TABLE trees 
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS season,
  DROP COLUMN IF EXISTS years_to_fruit,
  DROP COLUMN IF EXISTS mature_height;

-- 3. Remove indexes for the removed fields
DROP INDEX IF EXISTS idx_trees_category;
DROP INDEX IF EXISTS idx_trees_season;
DROP INDEX IF EXISTS idx_trees_mature_height;

-- 4. Remove constraints that were added
ALTER TABLE trees DROP CONSTRAINT IF EXISTS check_category;
ALTER TABLE trees DROP CONSTRAINT IF EXISTS check_season;
ALTER TABLE trees DROP CONSTRAINT IF EXISTS check_mature_height;
ALTER TABLE trees DROP CONSTRAINT IF EXISTS check_years_to_fruit;

-- 5. Update existing records with some default scientific names (optional)
UPDATE trees SET scientific_name = 'Mangifera indica' WHERE code = 'M' AND scientific_name IS NULL;
UPDATE trees SET scientific_name = 'Citrus limon' WHERE code = 'L' AND scientific_name IS NULL;
UPDATE trees SET scientific_name = 'Malus domestica' WHERE code = 'A' AND scientific_name IS NULL;
UPDATE trees SET scientific_name = 'Psidium guajava' WHERE code = 'G' AND scientific_name IS NULL;

-- Commit transaction
COMMIT;

-- Verification query
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'trees' ORDER BY ordinal_position;

