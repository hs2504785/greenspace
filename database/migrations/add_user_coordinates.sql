-- ===================================================
-- ADD USER COORDINATES MIGRATION
-- ===================================================
-- This script adds latitude and longitude fields to users table
-- for precise location-based distance calculations

-- Add coordinate fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_accuracy INTEGER,
ADD COLUMN IF NOT EXISTS coordinates_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient location-based queries
CREATE INDEX IF NOT EXISTS idx_users_coordinates ON users (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.latitude IS 'User location latitude coordinate (decimal degrees)';
COMMENT ON COLUMN users.longitude IS 'User location longitude coordinate (decimal degrees)';
COMMENT ON COLUMN users.location_accuracy IS 'GPS accuracy in meters when coordinates were captured';
COMMENT ON COLUMN users.coordinates_updated_at IS 'Timestamp when coordinates were last updated';

-- Create a function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10,8), 
    lon1 DECIMAL(11,8), 
    lat2 DECIMAL(10,8), 
    lon2 DECIMAL(11,8)
) RETURNS DECIMAL(10,3) AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := RADIANS(lat2 - lat1);
    dlon := RADIANS(lon2 - lon1);
    
    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dlon/2) * SIN(dlon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a view for users with distance calculations (example usage)
-- This can be used in API queries to get distances from a reference point
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

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT ON users_with_location TO your_app_user;
-- GRANT EXECUTE ON FUNCTION calculate_distance TO your_app_user;

COMMENT ON VIEW users_with_location IS 'Enhanced users view with location type and precision indicators';
COMMENT ON FUNCTION calculate_distance IS 'Calculate distance between two coordinate points using Haversine formula';
