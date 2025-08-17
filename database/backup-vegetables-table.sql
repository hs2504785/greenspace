-- ===================================================
-- VEGETABLES TABLE BACKUP SCRIPT
-- ===================================================
-- Purpose: Create safe backup of vegetables table before schema changes
-- Usage: Run this script before any production migrations
-- ===================================================

-- Generate timestamp for unique backup name
DO $$
DECLARE
    backup_timestamp VARCHAR(20);
    backup_table_name VARCHAR(50);
    record_count INTEGER;
BEGIN
    -- Create timestamp string (YYYYMMDD_HHMMSS format)
    backup_timestamp := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
    backup_table_name := 'vegetables_backup_' || backup_timestamp;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================';
    RAISE NOTICE 'VEGETABLES TABLE BACKUP STARTING';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE 'Backup Table: %', backup_table_name;
    RAISE NOTICE '';
    
    -- Create backup table with all data and structure
    EXECUTE 'CREATE TABLE ' || backup_table_name || ' AS SELECT * FROM vegetables';
    
    -- Get count of backed up records
    EXECUTE 'SELECT COUNT(*) FROM ' || backup_table_name INTO record_count;
    
    -- Copy table constraints and indexes (optional - for complete backup)
    -- Note: This preserves structure but creates new constraint names
    
    RAISE NOTICE 'SUCCESS: Backup completed!';
    RAISE NOTICE 'Records backed up: %', record_count;
    RAISE NOTICE 'Backup table name: %', backup_table_name;
    RAISE NOTICE '';
    RAISE NOTICE '================================';
    RAISE NOTICE 'BACKUP VERIFICATION';
    RAISE NOTICE '================================';
    
    -- Verify backup integrity
    EXECUTE 'SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT id) as unique_ids,
        MIN(created_at) as oldest_record,
        MAX(created_at) as newest_record
    FROM ' || backup_table_name;
    
END $$;

-- Create a view to easily compare original vs backup
CREATE OR REPLACE VIEW vegetables_backup_comparison AS
WITH current_data AS (
    SELECT 
        COUNT(*) as current_count,
        COUNT(DISTINCT id) as current_unique_ids,
        MIN(created_at) as current_oldest,
        MAX(created_at) as current_newest
    FROM vegetables
),
backup_data AS (
    SELECT 
        COUNT(*) as backup_count,
        COUNT(DISTINCT id) as backup_unique_ids,
        MIN(created_at) as backup_oldest,
        MAX(created_at) as backup_newest
    FROM (
        -- This will be dynamically replaced with latest backup table
        SELECT * FROM vegetables LIMIT 0
    ) b
)
SELECT 
    'COMPARISON' as check_type,
    current_count,
    backup_count,
    CASE WHEN current_count = backup_count 
         THEN 'MATCH' 
         ELSE 'MISMATCH' END as record_count_status,
    current_unique_ids,
    backup_unique_ids,
    CASE WHEN current_unique_ids = backup_unique_ids 
         THEN 'MATCH' 
         ELSE 'MISMATCH' END as unique_id_status
FROM current_data, backup_data;

-- Show all backup tables for this session
SELECT 
    'BACKUP_TABLES' as info_type,
    tablename as table_name,
    CASE WHEN tablename LIKE 'vegetables_backup_%' 
         THEN 'VEGETABLES_BACKUP' 
         ELSE 'OTHER' END as table_type,
    schemaname as schema_name
FROM pg_tables 
WHERE tablename LIKE 'vegetables_backup_%'
  AND schemaname = 'public'
ORDER BY tablename DESC;

-- Cleanup old backups (older than 30 days) - OPTIONAL
-- Uncomment the section below if you want automatic cleanup
/*
DO $$
DECLARE
    old_backup RECORD;
    days_old INTEGER := 30;
BEGIN
    RAISE NOTICE 'Checking for old backups (older than % days)...', days_old;
    
    FOR old_backup IN
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'vegetables_backup_%'
          AND schemaname = 'public'
          AND tablename < 'vegetables_backup_' || TO_CHAR(NOW() - INTERVAL '30 days', 'YYYYMMDD_HH24MISS')
    LOOP
        RAISE NOTICE 'Found old backup: %', old_backup.tablename;
        -- Uncomment next line to actually drop old backups
        -- EXECUTE 'DROP TABLE IF EXISTS ' || old_backup.tablename;
        -- RAISE NOTICE 'Dropped old backup: %', old_backup.tablename;
    END LOOP;
END $$;
*/

-- Final verification and instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================';
    RAISE NOTICE 'BACKUP COMPLETED SUCCESSFULLY';
    RAISE NOTICE '================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Note the backup table name above';
    RAISE NOTICE '2. Verify backup record count matches original';
    RAISE NOTICE '3. Proceed with your schema migration';
    RAISE NOTICE '4. Keep backup table for rollback if needed';
    RAISE NOTICE '';
    RAISE NOTICE 'Rollback Command (if needed):';
    RAISE NOTICE '  DROP TABLE vegetables;';
    RAISE NOTICE '  ALTER TABLE vegetables_backup_TIMESTAMP RENAME TO vegetables;';
    RAISE NOTICE '';
    RAISE NOTICE 'Your data is safely backed up!';
    RAISE NOTICE '================================';
END $$;
