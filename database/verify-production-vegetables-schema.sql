-- ===================================================
-- VEGETABLES TABLE PRODUCTION SCHEMA VERIFICATION
-- ===================================================
-- Purpose: Verify vegetables table schema in production environment
-- Run this BEFORE and AFTER migration to ensure correctness
-- ===================================================

-- Check if vegetables table exists
SELECT 
    'TABLE_EXISTS' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vegetables' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END as status,
    'Vegetables table exists' as description;

-- Check column count and structure
SELECT 
    'COLUMN_COUNT' as check_type,
    CASE WHEN COUNT(*) = 14 THEN 'PASS' ELSE 'FAIL' END as status,
    CONCAT('Found ', COUNT(*), ' columns (expected: 14)') as description
FROM information_schema.columns 
WHERE table_name = 'vegetables' AND table_schema = 'public';

-- Check required columns exist
WITH required_columns AS (
    SELECT UNNEST(ARRAY[
        'id', 'name', 'description', 'price', 'quantity', 'category', 
        'unit', 'images', 'owner_id', 'location', 'source_type', 
        'organic', 'harvest_date', 'expiry_date', 'available', 
        'created_at', 'updated_at'
    ]) as column_name
),
existing_columns AS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'vegetables' AND table_schema = 'public'
)
SELECT 
    'REQUIRED_COLUMNS' as check_type,
    CASE WHEN COUNT(rc.column_name) = COUNT(ec.column_name) 
         THEN 'PASS' 
         ELSE 'FAIL' END as status,
    STRING_AGG(
        CASE WHEN ec.column_name IS NULL 
             THEN rc.column_name || ' (MISSING)' 
             ELSE rc.column_name || ' (OK)' END, 
        ', ' ORDER BY rc.column_name
    ) as description
FROM required_columns rc
LEFT JOIN existing_columns ec ON rc.column_name = ec.column_name;

-- Check data types for critical columns
SELECT 
    'DATA_TYPES' as check_type,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    CASE WHEN COUNT(*) = 0 
         THEN 'All data types correct'
         ELSE CONCAT(COUNT(*), ' data type issues found') END as description
FROM (
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'vegetables' AND table_schema = 'public'
      AND (
        (column_name = 'id' AND data_type != 'uuid') OR
        (column_name = 'price' AND data_type != 'numeric') OR
        (column_name = 'quantity' AND data_type != 'integer') OR
        (column_name = 'organic' AND data_type != 'boolean') OR
        (column_name = 'available' AND data_type != 'boolean') OR
        (column_name = 'images' AND data_type != 'ARRAY')
    )
) incorrect_types;

-- Check foreign key constraints
SELECT 
    'FOREIGN_KEYS' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END as status,
    CONCAT('Found ', COUNT(*), ' foreign key constraint (expected: 1)') as description
FROM information_schema.table_constraints 
WHERE table_name = 'vegetables' 
  AND constraint_type = 'FOREIGN KEY';

-- Check indexes exist
SELECT 
    'INDEXES' as check_type,
    CASE WHEN COUNT(*) >= 8 THEN 'PASS' ELSE 'WARNING' END as status,
    CONCAT('Found ', COUNT(*), ' indexes (expected: 8+)') as description
FROM pg_indexes 
WHERE tablename = 'vegetables' 
  AND schemaname = 'public'
  AND indexname LIKE 'idx_vegetables_%';

-- Check RLS policies
SELECT 
    'RLS_POLICIES' as check_type,
    CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'WARNING' END as status,
    CONCAT('Found ', COUNT(*), ' RLS policies (expected: 4)') as description
FROM pg_policies 
WHERE tablename = 'vegetables';

-- Check sample data structure (if any data exists)
SELECT 
    'SAMPLE_DATA' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'DATA_EXISTS' ELSE 'NO_DATA' END as status,
    CONCAT('Found ', COUNT(*), ' vegetable records') as description
FROM vegetables;

-- Detailed column information
SELECT 
    'COLUMN_DETAILS' as check_type,
    'INFO' as status,
    CONCAT(
        column_name, ' | ', 
        data_type,
        CASE WHEN character_maximum_length IS NOT NULL 
             THEN '(' || character_maximum_length || ')' 
             ELSE '' END,
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE ' NULL' END,
        CASE WHEN column_default IS NOT NULL 
             THEN ' DEFAULT ' || column_default 
             ELSE '' END
    ) as description
FROM information_schema.columns 
WHERE table_name = 'vegetables' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Performance check - show table size and statistics
SELECT 
    'TABLE_STATS' as check_type,
    'INFO' as status,
    CONCAT(
        'Rows: ', n_tup_ins + n_tup_upd + n_tup_del,
        ', Live: ', n_live_tup,
        ', Dead: ', n_dead_tup,
        ', Last Analyze: ', last_analyze
    ) as description
FROM pg_stat_user_tables 
WHERE relname = 'vegetables';

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================';
    RAISE NOTICE 'VEGETABLES SCHEMA VERIFICATION COMPLETE';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Review the results above to ensure:';
    RAISE NOTICE '1. Table exists with 14+ columns';
    RAISE NOTICE '2. All required columns are present';
    RAISE NOTICE '3. Data types are correct';
    RAISE NOTICE '4. Foreign keys and indexes exist';
    RAISE NOTICE '5. RLS policies are configured';
    RAISE NOTICE '================================';
END $$;
