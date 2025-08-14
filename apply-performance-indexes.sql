-- Apply Performance Indexes to GreenSpace Database
-- Run this script to improve database query performance

\echo 'Applying performance indexes to improve query speed...'

-- Run the performance indexes script
\i src/db/performance-indexes.sql

\echo 'Performance indexes applied successfully!'
\echo 'The seller requests page should now load much faster.'

-- Check if indexes were created
\echo 'Checking created indexes:'
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('users', 'seller_requests', 'vegetables', 'orders', 'discussions', 'comments')
ORDER BY tablename, indexname;

\echo 'Index application complete!'
