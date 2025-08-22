-- =============================================================================
-- FIX SOURCE_TYPE CHECK CONSTRAINT
-- =============================================================================
-- This fixes the check constraint that's blocking vegetable creation
-- =============================================================================

-- Step 1: Check current constraint
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conname = 'vegetables_source_type_check';

-- Step 2: Check current valid values (if constraint exists)
\d vegetables

-- Step 3: Drop the problematic constraint
ALTER TABLE vegetables DROP CONSTRAINT IF EXISTS vegetables_source_type_check;

-- Step 4: Add new constraint with correct values
ALTER TABLE vegetables 
ADD CONSTRAINT vegetables_source_type_check 
CHECK (source_type IN ('user', 'seller', 'admin', 'import', 'api'));

-- Alternative: If you want simpler constraint
-- ALTER TABLE vegetables 
-- ADD CONSTRAINT vegetables_source_type_check 
-- CHECK (source_type IN ('seller', 'buyer', 'admin'));

-- Step 5: Verify the fix
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conname = 'vegetables_source_type_check';

-- Step 6: Test with sample data (optional)
-- SELECT 'seller'::text IN (SELECT unnest(enum_range(NULL::source_type_enum))) as is_valid;

-- =============================================================================
-- END OF FIX
-- =============================================================================
