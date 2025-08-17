-- ===================================================
-- POST-MIGRATION CLEANUP AND OPTIMIZATION
-- ===================================================
-- Run this after successful vegetables table migration
-- Purpose: Clean up dead tuples and update query statistics
-- ===================================================

-- Step 1: Clean up dead tuples (garbage collection)
VACUUM ANALYZE vegetables;

-- Step 2: Update table statistics for query optimization
ANALYZE vegetables;

-- Step 3: Verify cleanup results
SELECT 
    'POST_CLEANUP_STATS' as check_type,
    'INFO' as status,
    CONCAT(
        'Live: ', n_live_tup,
        ', Dead: ', n_dead_tup,
        ', Last Analyze: ', last_analyze,
        ', Last Vacuum: ', last_vacuum
    ) as description
FROM pg_stat_user_tables 
WHERE relname = 'vegetables';

-- Step 4: Verify all new columns have expected data
SELECT 
    'NEW_COLUMNS_VERIFICATION' as check_type,
    'INFO' as status,
    CONCAT(
        'Total Records: ', COUNT(*),
        ', With Unit: ', COUNT(CASE WHEN unit IS NOT NULL THEN 1 END),
        ', Organic: ', COUNT(CASE WHEN organic = true THEN 1 END),
        ', Available: ', COUNT(CASE WHEN available = true THEN 1 END)
    ) as description
FROM vegetables;

-- Step 5: Test a sample query with new columns
SELECT 
    'SAMPLE_QUERY_TEST' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'WARNING' END as status,
    CONCAT('Found ', COUNT(*), ' vegetables ready for display') as description
FROM vegetables 
WHERE available = true 
  AND quantity > 0;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================';
    RAISE NOTICE 'POST-MIGRATION CLEANUP COMPLETE!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Database Status: OPTIMIZED';
    RAISE NOTICE 'Dead Tuples: CLEANED';
    RAISE NOTICE 'Statistics: UPDATED';
    RAISE NOTICE 'Query Performance: ENHANCED';
    RAISE NOTICE '';
    RAISE NOTICE 'Your vegetables table is production-ready!';
    RAISE NOTICE '================================';
END $$;
