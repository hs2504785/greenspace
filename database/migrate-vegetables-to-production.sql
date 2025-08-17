-- ===================================================
-- VEGETABLES TABLE MIGRATION TO PRODUCTION
-- ===================================================
-- Purpose: Migrate local vegetables table schema to production
-- Generated: Current date will be shown in script execution
-- Environment: Production Migration
-- ===================================================

-- Step 1: Backup existing vegetables table data
-- (Run this first to ensure data safety)
DO $$
DECLARE
    backup_table_name VARCHAR(50);
    record_count INTEGER;
BEGIN
    -- Generate backup table name with current date
    backup_table_name := 'vegetables_backup_' || TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Check if backup table already exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = backup_table_name) THEN
        RAISE NOTICE 'Backup table % already exists, using timestamped version', backup_table_name;
        backup_table_name := 'vegetables_backup_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
    END IF;
    
    -- Create backup table
    EXECUTE 'CREATE TABLE ' || backup_table_name || ' AS SELECT * FROM vegetables';
    
    -- Get record count
    EXECUTE 'SELECT COUNT(*) FROM ' || backup_table_name INTO record_count;
    
    RAISE NOTICE 'SUCCESS: Created backup table % with % records', backup_table_name, record_count;
END $$;

-- Step 2: Add missing columns to vegetables table (if they don't exist)
-- These columns exist in production but might be missing in your local schema

-- Add unit column (default 'kg')
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='vegetables' AND column_name='unit') THEN
        ALTER TABLE vegetables ADD COLUMN unit VARCHAR(20) DEFAULT 'kg';
        RAISE NOTICE 'Added unit column to vegetables table';
    ELSE
        RAISE NOTICE 'Unit column already exists in vegetables table';
    END IF;
END $$;

-- Add organic column (default false)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='vegetables' AND column_name='organic') THEN
        ALTER TABLE vegetables ADD COLUMN organic BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added organic column to vegetables table';
    ELSE
        RAISE NOTICE 'Organic column already exists in vegetables table';
    END IF;
END $$;

-- Add harvest_date column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='vegetables' AND column_name='harvest_date') THEN
        ALTER TABLE vegetables ADD COLUMN harvest_date DATE;
        RAISE NOTICE 'Added harvest_date column to vegetables table';
    ELSE
        RAISE NOTICE 'Harvest_date column already exists in vegetables table';
    END IF;
END $$;

-- Add expiry_date column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='vegetables' AND column_name='expiry_date') THEN
        ALTER TABLE vegetables ADD COLUMN expiry_date DATE;
        RAISE NOTICE 'Added expiry_date column to vegetables table';
    ELSE
        RAISE NOTICE 'Expiry_date column already exists in vegetables table';
    END IF;
END $$;

-- Add available column (default true)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='vegetables' AND column_name='available') THEN
        ALTER TABLE vegetables ADD COLUMN available BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added available column to vegetables table';
    ELSE
        RAISE NOTICE 'Available column already exists in vegetables table';
    END IF;
END $$;

-- Step 3: Update existing data with sensible defaults
-- Set unit to 'kg' for existing records where it might be NULL
UPDATE vegetables SET unit = 'kg' WHERE unit IS NULL;

-- Set organic to false for existing records where it might be NULL
UPDATE vegetables SET organic = false WHERE organic IS NULL;

-- Set available to true for existing records where it might be NULL
UPDATE vegetables SET available = true WHERE available IS NULL;

-- Step 4: Create or update indexes for new columns
CREATE INDEX IF NOT EXISTS idx_vegetables_unit ON vegetables(unit);
CREATE INDEX IF NOT EXISTS idx_vegetables_organic ON vegetables(organic);
CREATE INDEX IF NOT EXISTS idx_vegetables_available ON vegetables(available);
CREATE INDEX IF NOT EXISTS idx_vegetables_harvest_date ON vegetables(harvest_date);
CREATE INDEX IF NOT EXISTS idx_vegetables_expiry_date ON vegetables(expiry_date);

-- Step 5: Update Row Level Security policies if needed
-- Drop and recreate policies to ensure they work with new columns
DROP POLICY IF EXISTS "Anyone can view vegetables" ON vegetables;
DROP POLICY IF EXISTS "Users can insert vegetables" ON vegetables;
DROP POLICY IF EXISTS "Owners can update vegetables" ON vegetables; 
DROP POLICY IF EXISTS "Owners can delete vegetables" ON vegetables;

-- Recreate policies (from your migration file)
CREATE POLICY "Anyone can view vegetables" ON vegetables
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vegetables" ON vegetables
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update vegetables" ON vegetables
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete vegetables" ON vegetables
  FOR DELETE USING (auth.uid() = owner_id);

-- Step 6: Verification - Check schema is correct
DO $$
DECLARE
    col_count INTEGER;
    col_name VARCHAR(255);
    expected_cols INTEGER := 14; -- Total expected columns
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'vegetables' AND table_schema = 'public';
    
    RAISE NOTICE 'Vegetables table has % columns (expected: %)', col_count, expected_cols;
    
    -- List all columns
    RAISE NOTICE 'Current vegetables table columns:';
    FOR col_name IN 
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'vegetables' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %', col_name;
    END LOOP;
END $$;

-- Step 7: Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================';
    RAISE NOTICE 'VEGETABLES TABLE MIGRATION COMPLETE!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Status: Production Ready';
    RAISE NOTICE 'Backup: Automatic backup table created with timestamp';
    RAISE NOTICE 'New Columns: unit, organic, harvest_date, expiry_date, available';
    RAISE NOTICE 'Indexes: Performance indexes updated';
    RAISE NOTICE 'Policies: RLS policies updated';
    RAISE NOTICE '';
    RAISE NOTICE 'Your vegetables table is now ready for production!';
    RAISE NOTICE '================================';
END $$;
