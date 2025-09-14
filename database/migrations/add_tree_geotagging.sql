-- ===================================================
-- ADD TREE GEOTAGGING MIGRATION
-- ===================================================
-- This script adds GPS coordinates to tree positions for precise location tracking
-- Enhances existing grid-based system with real-world coordinates

-- Add GPS coordinate fields to tree_positions table
ALTER TABLE tree_positions 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS altitude DECIMAL(8, 3), -- meters above sea level
ADD COLUMN IF NOT EXISTS gps_accuracy INTEGER, -- accuracy in meters
ADD COLUMN IF NOT EXISTS coordinates_captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS coordinate_source VARCHAR(50) DEFAULT 'manual'; -- manual, gps, survey, satellite

-- Add index for efficient location-based queries
CREATE INDEX IF NOT EXISTS idx_tree_positions_coordinates 
ON tree_positions (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add spatial index for advanced geospatial queries (if PostGIS is available)
-- CREATE INDEX IF NOT EXISTS idx_tree_positions_geom 
-- ON tree_positions USING GIST (ST_Point(longitude, latitude));

-- Add comments for documentation
COMMENT ON COLUMN tree_positions.latitude IS 'Tree GPS latitude coordinate (decimal degrees)';
COMMENT ON COLUMN tree_positions.longitude IS 'Tree GPS longitude coordinate (decimal degrees)';
COMMENT ON COLUMN tree_positions.altitude IS 'Tree altitude in meters above sea level';
COMMENT ON COLUMN tree_positions.gps_accuracy IS 'GPS accuracy in meters when coordinates were captured';
COMMENT ON COLUMN tree_positions.coordinates_captured_at IS 'Timestamp when GPS coordinates were captured';
COMMENT ON COLUMN tree_positions.coordinate_source IS 'Source of coordinates: manual, gps, survey, satellite';

-- Create function to calculate distance between two tree positions
CREATE OR REPLACE FUNCTION calculate_tree_distance(
    tree_pos_1_id UUID,
    tree_pos_2_id UUID
) RETURNS DECIMAL(10,3) AS $$
DECLARE
    lat1 DECIMAL(10,8);
    lon1 DECIMAL(11,8);
    lat2 DECIMAL(10,8);
    lon2 DECIMAL(11,8);
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Get coordinates for both tree positions
    SELECT latitude, longitude INTO lat1, lon1 
    FROM tree_positions WHERE id = tree_pos_1_id;
    
    SELECT latitude, longitude INTO lat2, lon2 
    FROM tree_positions WHERE id = tree_pos_2_id;
    
    -- Return null if either position lacks coordinates
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
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

-- Create view for trees with enhanced location data
-- Note: Only using basic fields that definitely exist in trees table
CREATE OR REPLACE VIEW trees_with_location AS
SELECT 
    tp.*,
    t.name as tree_name,
    t.code as tree_code,
    t.description as tree_description,
    CASE 
        WHEN tp.latitude IS NOT NULL AND tp.longitude IS NOT NULL 
        THEN 'geotagged'
        ELSE 'grid_only'
    END as location_type,
    CASE 
        WHEN tp.gps_accuracy IS NOT NULL AND tp.gps_accuracy < 5 
        THEN 'high'
        WHEN tp.gps_accuracy IS NOT NULL AND tp.gps_accuracy < 15 
        THEN 'medium'
        WHEN tp.gps_accuracy IS NOT NULL 
        THEN 'low'
        ELSE NULL
    END as location_precision,
    -- Calculate grid-based distance from farm center (assuming 0,0 is center)
    SQRT(POWER(tp.grid_x, 2) + POWER(tp.grid_y, 2)) * 0.3048 as grid_distance_meters, -- assuming 1 grid unit = 1 foot
    -- Format coordinates for display
    CASE 
        WHEN tp.latitude IS NOT NULL AND tp.longitude IS NOT NULL 
        THEN CONCAT(
            ROUND(tp.latitude::numeric, 6), '°N, ',
            ROUND(tp.longitude::numeric, 6), '°E'
        )
        ELSE NULL
    END as coordinates_display
FROM tree_positions tp
JOIN trees t ON tp.tree_id = t.id;

-- Add comment for the view
COMMENT ON VIEW trees_with_location IS 'Enhanced tree positions view with GPS coordinates and location metadata';

-- Show what columns exist in trees table for debugging
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Tree geotagging fields added successfully';
    RAISE NOTICE '📍 Trees can now store precise GPS coordinates';
    RAISE NOTICE '🗺️ Enhanced location tracking and spatial analysis enabled';
    RAISE NOTICE '📊 Use trees_with_location view for location-enhanced queries';
    RAISE NOTICE '🔍 Check the column list above to see what fields exist in your trees table';
END $$;
