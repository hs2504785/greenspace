-- ===================================================
-- DATABASE STATE VERIFICATION
-- ===================================================
-- Quick script to verify current database state
-- Run this to check if everything is working properly

-- Check all tables exist and their row counts
SELECT 'Database Health Check' as status;

-- Table existence and basic stats
SELECT 
    schemaname,
    tablename,
    tableowner,
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items')
ORDER BY tablename;

-- Quick row counts (will show 0 for empty tables)
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'vegetables' as table_name, COUNT(*) as row_count FROM vegetables  
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as row_count FROM orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as row_count FROM order_items
ORDER BY table_name;

-- Check if any RLS policies exist (should be empty in current working state)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify key indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
