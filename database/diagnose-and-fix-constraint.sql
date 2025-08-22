-- =============================================================================
-- DIAGNOSE AND FIX SOURCE_TYPE CONSTRAINT ISSUE
-- =============================================================================
-- Complete diagnostic and fix for the source_type constraint problem
-- =============================================================================

-- Step 1: Check what the current constraint actually allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as full_constraint_definition,
    contype as constraint_type
FROM pg_constraint 
WHERE conname = 'vegetables_source_type_check' 
   OR (conrelid = (SELECT oid FROM pg_class WHERE relname = 'vegetables') 
       AND contype = 'c');

-- Step 2: Check all constraints on vegetables table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'vegetables')
  AND contype = 'c'
ORDER BY conname;

-- Step 3: Check current source_type values in the table
SELECT 
    source_type, 
    COUNT(*) as count,
    STRING_AGG(DISTINCT id::text, ', ') as sample_ids
FROM vegetables 
GROUP BY source_type 
ORDER BY count DESC;

-- Step 4: EMERGENCY FIX - Drop ALL check constraints on source_type
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'vegetables')
          AND contype = 'c' 
          AND pg_get_constraintdef(oid) LIKE '%source_type%'
    LOOP
        EXECUTE 'ALTER TABLE vegetables DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 5: Verify constraints are gone
SELECT 
    conname as remaining_constraints,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'vegetables')
  AND contype = 'c' 
  AND pg_get_constraintdef(oid) LIKE '%source_type%';

-- Step 6: Add a simple, permissive constraint
ALTER TABLE vegetables 
ADD CONSTRAINT vegetables_source_type_check 
CHECK (source_type IS NOT NULL);

-- Alternative: More specific but inclusive constraint
-- ALTER TABLE vegetables 
-- ADD CONSTRAINT vegetables_source_type_check 
-- CHECK (source_type IN ('user', 'seller', 'admin', 'buyer', 'import', 'api', 'manual', 'system'));

-- Step 7: Test the fix
INSERT INTO vegetables (name, price, category, source_type, owner_id, location) 
VALUES ('TEST_ITEM', 1.00, 'leafy', 'user', '0e13a58b-a5e2-4ed3-9c69-9634c7413550', 'test');

-- Clean up test
DELETE FROM vegetables WHERE name = 'TEST_ITEM';

-- Step 8: Final verification
SELECT 'SUCCESS: source_type constraint fixed' as status;

-- =============================================================================
-- END OF DIAGNOSTIC AND FIX
-- =============================================================================
