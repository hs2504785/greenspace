-- ===================================================
-- SUPABASE DATABASE BACKUP GENERATOR
-- ===================================================
-- This script generates a complete backup of the current database schema,
-- policies, and structure (without data) for the Arya Natural Farms application.
-- 
-- Run this in Supabase SQL Editor to generate backup statements.
-- Date: August 14, 2025
-- Status: Working production state

-- ===================================================
-- 1. GENERATE TABLE SCHEMAS
-- ===================================================

-- Show current table structures
SELECT 
    'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' ||
    array_to_string(
        array_agg(
            column_name || ' ' || 
            CASE 
                WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
                WHEN data_type = 'USER-DEFINED' THEN udt_name
                ELSE UPPER(data_type)
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
        ), 
        E',\n    '
    ) || 
    E'\n);' as create_statement
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'vegetables', 'orders', 'order_items')
GROUP BY table_name
ORDER BY table_name;

-- ===================================================
-- 2. GENERATE RLS POLICIES
-- ===================================================

-- Show current RLS policies
SELECT 
    'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' as enable_rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items');

-- Show existing policies (if any)
SELECT 
    'CREATE POLICY "' || policyname || '" ON ' || tablename ||
    ' FOR ' || cmd ||
    CASE 
        WHEN roles IS NOT NULL THEN ' TO ' || array_to_string(roles, ', ')
        ELSE ''
    END ||
    CASE 
        WHEN qual IS NOT NULL THEN ' USING (' || qual || ')'
        ELSE ''
    END ||
    CASE 
        WHEN with_check IS NOT NULL AND with_check != qual THEN ' WITH CHECK (' || with_check || ')'
        ELSE ''
    END || ';' as policy_statement
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items')
ORDER BY tablename, policyname;

-- ===================================================
-- 3. GENERATE CONSTRAINTS & INDEXES
-- ===================================================

-- Show primary key constraints
SELECT 
    'ALTER TABLE ' || table_name || 
    ' ADD CONSTRAINT ' || constraint_name || 
    ' PRIMARY KEY (' || column_name || ');' as pk_statement
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'vegetables', 'orders', 'order_items');

-- Show foreign key constraints  
SELECT 
    'ALTER TABLE ' || tc.table_name || 
    ' ADD CONSTRAINT ' || tc.constraint_name || 
    ' FOREIGN KEY (' || kcu.column_name || ')' ||
    ' REFERENCES ' || ccu.table_name || '(' || ccu.column_name || ');' as fk_statement
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'vegetables', 'orders', 'order_items');

-- ===================================================
-- 4. GENERATE PERMISSIONS
-- ===================================================

-- Show table permissions
SELECT 
    'GRANT ' || privilege_type || ' ON ' || table_name || 
    ' TO ' || grantee || ';' as grant_statement
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('users', 'vegetables', 'orders', 'order_items')
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ===================================================
-- 5. CHECK CURRENT STATE
-- ===================================================

-- Verify current table exists and record count
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
    CASE 
        WHEN table_name = 'users' THEN (SELECT COUNT(*) FROM users)
        WHEN table_name = 'vegetables' THEN (SELECT COUNT(*) FROM vegetables) 
        WHEN table_name = 'orders' THEN (SELECT COUNT(*) FROM orders)
        WHEN table_name = 'order_items' THEN (SELECT COUNT(*) FROM order_items)
    END as row_count
FROM (VALUES ('users'), ('vegetables'), ('orders'), ('order_items')) as t(table_name)
ORDER BY table_name;
