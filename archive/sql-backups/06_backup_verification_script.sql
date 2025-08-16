-- ===================================================
-- GREENSPACE MARKETPLACE - BACKUP VERIFICATION SCRIPT
-- ===================================================
-- Generated on: December 20, 2024
-- Environment: Production Ready
-- Contains: Complete backup verification and database health check
-- Version: 1.0 - Phase 1 Production Launch
-- 
-- Purpose: Verify backup completeness and database health
-- Usage: Run this script to verify your database is properly configured
-- ===================================================

-- ===================================================
-- VERIFICATION HEADER
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ================================';
    RAISE NOTICE '🔍 GREENSPACE BACKUP VERIFICATION';
    RAISE NOTICE '🔍 ================================';
    RAISE NOTICE '📅 Verification Date: %', NOW();
    RAISE NOTICE '📦 Database Version: Production v1.0';
    RAISE NOTICE '🎯 Target: Complete Health Check';
    RAISE NOTICE '⏱️  Estimated Time: 30-60 seconds';
    RAISE NOTICE '🔍 ================================';
    RAISE NOTICE '';
END $$;

-- ===================================================
-- 1. TABLE STRUCTURE VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '📋 SECTION 1: Verifying Table Structure...';
END $$;

-- Check if all required tables exist
SELECT 
    '1.1 TABLE EXISTENCE CHECK' as verification_section,
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM (VALUES 
    ('users'), 
    ('vegetables'), 
    ('orders'), 
    ('order_items'),
    ('guest_orders'),
    ('otp_verifications'),
    ('discussions'),
    ('comments')
) as t(table_name)
ORDER BY table_name;

-- Check table column details
SELECT 
    '1.2 COLUMN DETAILS' as verification_section,
    table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULLABLE' END as nullable_status,
    CASE WHEN column_default IS NOT NULL THEN 'HAS DEFAULT' ELSE 'NO DEFAULT' END as default_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
ORDER BY table_name, ordinal_position;

-- ===================================================
-- 2. INDEXES VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '⚡ SECTION 2: Verifying Performance Indexes...';
END $$;

-- Check if all performance indexes exist
SELECT 
    '2.1 INDEX EXISTENCE CHECK' as verification_section,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
ORDER BY tablename, indexname;

-- Count indexes per table
SELECT 
    '2.2 INDEX COUNT PER TABLE' as verification_section,
    tablename,
    COUNT(*) as index_count,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ WELL INDEXED'
        WHEN COUNT(*) >= 1 THEN '⚠️ BASIC INDEXING'
        ELSE '❌ NO INDEXES'
    END as index_status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
GROUP BY tablename
ORDER BY tablename;

-- ===================================================
-- 3. CONSTRAINTS VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '🔗 SECTION 3: Verifying Constraints and Relationships...';
END $$;

-- Check primary key constraints
SELECT 
    '3.1 PRIMARY KEY CONSTRAINTS' as verification_section,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    '✅ PRIMARY KEY' as constraint_status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
ORDER BY tc.table_name;

-- Check foreign key constraints
SELECT 
    '3.2 FOREIGN KEY CONSTRAINTS' as verification_section,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    '✅ FOREIGN KEY' as constraint_status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
ORDER BY tc.table_name, kcu.column_name;

-- Check check constraints
SELECT 
    '3.3 CHECK CONSTRAINTS' as verification_section,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause,
    '✅ CHECK CONSTRAINT' as constraint_status
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
ORDER BY tc.table_name;

-- ===================================================
-- 4. FUNCTIONS VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '⚙️ SECTION 4: Verifying Functions and Procedures...';
END $$;

-- Check custom functions
SELECT 
    '4.1 CUSTOM FUNCTIONS' as verification_section,
    routine_name,
    routine_type,
    data_type as return_type,
    CASE 
        WHEN routine_definition IS NOT NULL THEN '✅ FUNCTION ACTIVE'
        ELSE '❌ FUNCTION MISSING'
    END as function_status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- Test core functions
DO $$
DECLARE
    test_result BOOLEAN;
    otp_code VARCHAR(6);
BEGIN
    -- Test OTP generation function
    SELECT generate_otp_code() INTO otp_code;
    IF LENGTH(otp_code) = 6 THEN
        RAISE NOTICE '✅ generate_otp_code() function working: %', otp_code;
    ELSE
        RAISE NOTICE '❌ generate_otp_code() function failed';
    END IF;
    
    -- Test admin check function (with null handling)
    BEGIN
        SELECT is_admin(NULL) INTO test_result;
        RAISE NOTICE '✅ is_admin() function working: % (null test)', test_result;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ is_admin() function error: %', SQLERRM;
    END;
    
    -- Test seller check function (with null handling)
    BEGIN
        SELECT is_seller(NULL) INTO test_result;
        RAISE NOTICE '✅ is_seller() function working: % (null test)', test_result;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ is_seller() function error: %', SQLERRM;
    END;
END $$;

-- ===================================================
-- 5. TRIGGERS VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 SECTION 5: Verifying Triggers...';
END $$;

-- Check all triggers
SELECT 
    '5.1 TRIGGER STATUS' as verification_section,
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation,
    '✅ TRIGGER ACTIVE' as trigger_status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
ORDER BY event_object_table, trigger_name;

-- ===================================================
-- 6. SECURITY VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '🔐 SECTION 6: Verifying Security Configuration...';
END $$;

-- Check RLS status
SELECT 
    '6.1 ROW LEVEL SECURITY STATUS' as verification_section,
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS ENABLED'
        ELSE '🔓 RLS DISABLED'
    END as rls_status,
    CASE 
        WHEN tablename IN ('guest_orders', 'otp_verifications') AND rowsecurity THEN '✅ CORRECT'
        WHEN tablename NOT IN ('guest_orders', 'otp_verifications') AND NOT rowsecurity THEN '✅ CORRECT'
        ELSE '⚠️ CHECK NEEDED'
    END as configuration_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
ORDER BY tablename;

-- Check policies (for tables with RLS enabled)
SELECT 
    '6.2 RLS POLICIES' as verification_section,
    tablename,
    policyname,
    cmd as policy_command,
    '✅ POLICY ACTIVE' as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('guest_orders', 'otp_verifications')
ORDER BY tablename, policyname;

-- ===================================================
-- 7. PERMISSIONS VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '🔑 SECTION 7: Verifying Permissions...';
END $$;

-- Check table permissions
SELECT 
    '7.1 TABLE PERMISSIONS' as verification_section,
    table_name,
    grantee,
    privilege_type,
    CASE 
        WHEN grantee IN ('authenticated', 'anon', 'service_role') THEN '✅ EXPECTED ROLE'
        ELSE '⚠️ CUSTOM ROLE'
    END as permission_status
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- Check sequence permissions
SELECT 
    '7.2 SEQUENCE PERMISSIONS' as verification_section,
    object_name,
    grantee,
    privilege_type,
    '✅ SEQUENCE ACCESS' as permission_status
FROM information_schema.role_usage_grants
WHERE object_schema = 'public'
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY object_name, grantee;

-- ===================================================
-- 8. DATA INTEGRITY VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 SECTION 8: Verifying Data Integrity...';
END $$;

-- Check for any data in tables (should be empty for fresh deployment)
SELECT 
    '8.1 TABLE ROW COUNTS' as verification_section,
    table_name,
    CASE 
        WHEN table_name = 'users' THEN (SELECT COUNT(*) FROM users)
        WHEN table_name = 'vegetables' THEN (SELECT COUNT(*) FROM vegetables)
        WHEN table_name = 'orders' THEN (SELECT COUNT(*) FROM orders)
        WHEN table_name = 'order_items' THEN (SELECT COUNT(*) FROM order_items)
        WHEN table_name = 'guest_orders' THEN (SELECT COUNT(*) FROM guest_orders)
        WHEN table_name = 'otp_verifications' THEN (SELECT COUNT(*) FROM otp_verifications)
        WHEN table_name = 'discussions' THEN (SELECT COUNT(*) FROM discussions)
        WHEN table_name = 'comments' THEN (SELECT COUNT(*) FROM comments)
        ELSE 0
    END as row_count,
    CASE 
        WHEN table_name = 'users' AND (SELECT COUNT(*) FROM users) > 0 THEN '📊 HAS DATA'
        WHEN table_name = 'vegetables' AND (SELECT COUNT(*) FROM vegetables) > 0 THEN '📊 HAS DATA'
        WHEN table_name = 'orders' AND (SELECT COUNT(*) FROM orders) > 0 THEN '📊 HAS DATA'
        WHEN table_name = 'order_items' AND (SELECT COUNT(*) FROM order_items) > 0 THEN '📊 HAS DATA'
        WHEN table_name = 'guest_orders' AND (SELECT COUNT(*) FROM guest_orders) > 0 THEN '📊 HAS DATA'
        WHEN table_name = 'otp_verifications' AND (SELECT COUNT(*) FROM otp_verifications) > 0 THEN '📊 HAS DATA'
        WHEN table_name = 'discussions' AND (SELECT COUNT(*) FROM discussions) > 0 THEN '📊 HAS DATA'
        WHEN table_name = 'comments' AND (SELECT COUNT(*) FROM comments) > 0 THEN '📊 HAS DATA'
        ELSE '🆕 EMPTY (EXPECTED)'
    END as data_status
FROM (VALUES 
    ('users'), ('vegetables'), ('orders'), ('order_items'),
    ('guest_orders'), ('otp_verifications'), ('discussions'), ('comments')
) as t(table_name)
ORDER BY table_name;

-- ===================================================
-- 9. PERFORMANCE VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '⚡ SECTION 9: Verifying Performance Configuration...';
END $$;

-- Check table sizes and performance metrics
SELECT 
    '9.1 TABLE PERFORMANCE METRICS' as verification_section,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ===================================================
-- 10. EXTENSIONS VERIFICATION
-- ===================================================

DO $$
BEGIN
    RAISE NOTICE '📦 SECTION 10: Verifying Database Extensions...';
END $$;

-- Check installed extensions
SELECT 
    '10.1 INSTALLED EXTENSIONS' as verification_section,
    extname as extension_name,
    extversion as version,
    '✅ EXTENSION ACTIVE' as extension_status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- ===================================================
-- VERIFICATION SUMMARY
-- ===================================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
    extension_count INTEGER;
    
    -- Expected counts
    expected_tables INTEGER := 8;
    expected_extensions INTEGER := 2;
    min_expected_indexes INTEGER := 15;
    min_expected_functions INTEGER := 4;
    min_expected_triggers INTEGER := 6;
    
    overall_status TEXT := '✅ PASSED';
BEGIN
    -- Count all components
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('users', 'vegetables', 'orders', 'order_items', 'guest_orders', 'otp_verifications', 'discussions', 'comments');
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
    
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name NOT LIKE 'pg_%';
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO extension_count
    FROM pg_extension
    WHERE extname IN ('uuid-ossp', 'pgcrypto');
    
    -- Determine overall status
    IF table_count < expected_tables THEN overall_status := '❌ FAILED'; END IF;
    IF index_count < min_expected_indexes THEN overall_status := '⚠️ WARNING'; END IF;
    IF function_count < min_expected_functions THEN overall_status := '⚠️ WARNING'; END IF;
    IF trigger_count < min_expected_triggers THEN overall_status := '⚠️ WARNING'; END IF;
    IF extension_count < expected_extensions THEN overall_status := '❌ FAILED'; END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 ================================';
    RAISE NOTICE '📊 VERIFICATION SUMMARY REPORT';
    RAISE NOTICE '📊 ================================';
    RAISE NOTICE '⏰ Completion Time: %', NOW();
    RAISE NOTICE '🎯 Overall Status: %', overall_status;
    RAISE NOTICE '';
    RAISE NOTICE '📋 Component Counts:';
    RAISE NOTICE '   • Tables: % / % expected', table_count, expected_tables;
    RAISE NOTICE '   • Indexes: % (min % expected)', index_count, min_expected_indexes;
    RAISE NOTICE '   • Functions: % (min % expected)', function_count, min_expected_functions;
    RAISE NOTICE '   • Triggers: % (min % expected)', trigger_count, min_expected_triggers;
    RAISE NOTICE '   • Policies: % active', policy_count;
    RAISE NOTICE '   • Extensions: % / % expected', extension_count, expected_extensions;
    RAISE NOTICE '';
    
    IF overall_status = '✅ PASSED' THEN
        RAISE NOTICE '🎉 VERIFICATION PASSED! Your database is ready for production.';
        RAISE NOTICE '🚀 Next steps: Deploy your application and test connections.';
    ELSIF overall_status = '⚠️ WARNING' THEN
        RAISE NOTICE '⚠️  VERIFICATION WARNING: Some components may need attention.';
        RAISE NOTICE '🔍 Review the detailed sections above for specific issues.';
    ELSE
        RAISE NOTICE '❌ VERIFICATION FAILED: Critical components are missing.';
        RAISE NOTICE '🛠️  Please re-run the deployment script and check for errors.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📞 Support: If you need help, check the deployment logs above.';
    RAISE NOTICE '📊 ================================';
    RAISE NOTICE '';
END $$;

-- ===================================================
-- BACKUP VERIFICATION COMPLETED
-- ===================================================
-- This verification script has checked:
-- ✅ Table structure and existence (8 tables)
-- ✅ Performance indexes (optimized queries)
-- ✅ Constraints and relationships (data integrity)
-- ✅ Functions and procedures (business logic)
-- ✅ Triggers (automated operations)
-- ✅ Security configuration (RLS and policies)
-- ✅ Permissions (access control)
-- ✅ Data integrity (row counts and validation)
-- ✅ Performance metrics (table sizes and optimization)
-- ✅ Extensions (required PostgreSQL extensions)
-- 
-- Your Greenspace Marketplace database verification is complete!
-- ===================================================
