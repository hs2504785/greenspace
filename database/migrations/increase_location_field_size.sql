-- ===================================================
-- INCREASE LOCATION FIELD SIZE MIGRATION
-- ===================================================
-- This script increases the location field size to accommodate full Google Maps URLs
-- Current limit: 200 characters
-- New limit: 500 characters (enough for full Google Maps URLs)

-- Increase location field size in users table
ALTER TABLE users 
ALTER COLUMN location TYPE VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN users.location IS 'User location - can be address, coordinates, or Google Maps URL (up to 500 characters)';

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'location';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Location field size increased to 500 characters';
    RAISE NOTICE '📍 Users can now save full Google Maps URLs';
    RAISE NOTICE '🔗 This enables better coordinate extraction from various URL formats';
END $$;
