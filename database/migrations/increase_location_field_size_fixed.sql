-- ===================================================
-- INCREASE LOCATION FIELD SIZE MIGRATION (FIXED)
-- ===================================================
-- This script increases the location field size to accommodate full Google Maps URLs
-- Current limit: 200 characters
-- New limit: 500 characters (enough for full Google Maps URLs)
-- 
-- Issue: The users_with_location view depends on the location column
-- Solution: Drop view, alter column, recreate view

-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS users_with_location;

-- Step 2: Increase location field size in users table
ALTER TABLE users 
ALTER COLUMN location TYPE VARCHAR(500);

-- Step 3: Recreate the users_with_location view
CREATE OR REPLACE VIEW users_with_location AS
SELECT 
    u.*,
    CASE 
        WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL 
        THEN 'coordinates'
        WHEN u.location IS NOT NULL 
        THEN 'text_only'
        ELSE 'none'
    END as location_type,
    CASE 
        WHEN u.location_accuracy IS NOT NULL AND u.location_accuracy < 50 
        THEN 'high'
        WHEN u.location_accuracy IS NOT NULL AND u.location_accuracy < 200 
        THEN 'medium'
        WHEN u.location_accuracy IS NOT NULL 
        THEN 'low'
        ELSE NULL
    END as location_precision
FROM users u;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN users.location IS 'User location - can be address, coordinates, or Google Maps URL (up to 500 characters)';
COMMENT ON VIEW users_with_location IS 'Enhanced users view with location type and precision indicators';

-- Step 5: Verify the change
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'location';

-- Step 6: Test that the view works
SELECT COUNT(*) as total_users FROM users_with_location;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Location field size increased to 500 characters';
    RAISE NOTICE '🔄 users_with_location view recreated successfully';
    RAISE NOTICE '📍 Users can now save full Google Maps URLs';
    RAISE NOTICE '🔗 This enables better coordinate extraction from various URL formats';
END $$;
