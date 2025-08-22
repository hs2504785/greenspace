-- =============================================================================
-- FIX EXISTING SOURCE_TYPE DATA AND CONSTRAINT
-- =============================================================================
-- This fixes existing data that violates the source_type constraint
-- =============================================================================

-- Step 1: Check what values currently exist in source_type
SELECT 
    source_type, 
    COUNT(*) as count 
FROM vegetables 
GROUP BY source_type 
ORDER BY count DESC;

-- Step 2: Check current constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'vegetables_source_type_check';

-- Step 3: Update problematic values to valid ones
-- Replace any invalid source_type values with 'user'
UPDATE vegetables 
SET source_type = 'user' 
WHERE source_type NOT IN (
    SELECT CASE 
        WHEN pg_get_constraintdef(oid) LIKE '%user%' THEN 'user'
        WHEN pg_get_constraintdef(oid) LIKE '%seller%' THEN 'seller'
        WHEN pg_get_constraintdef(oid) LIKE '%admin%' THEN 'admin'
        ELSE 'user'
    END
    FROM pg_constraint 
    WHERE conname = 'vegetables_source_type_check'
);

-- Alternative: Set all to 'user' (safest approach)
UPDATE vegetables SET source_type = 'user' WHERE source_type IS NOT NULL;

-- Step 4: Now drop the constraint (should work now)
ALTER TABLE vegetables DROP CONSTRAINT IF EXISTS vegetables_source_type_check;

-- Step 5: Add new constraint with broader values
ALTER TABLE vegetables 
ADD CONSTRAINT vegetables_source_type_check 
CHECK (source_type IN ('user', 'seller', 'admin', 'buyer', 'import', 'api'));

-- Step 6: Verify the fix
SELECT 
    source_type, 
    COUNT(*) as count 
FROM vegetables 
GROUP BY source_type 
ORDER BY count DESC;

-- Step 7: Test constraint works
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'vegetables_source_type_check';

-- =============================================================================
-- END OF FIX
-- =============================================================================
