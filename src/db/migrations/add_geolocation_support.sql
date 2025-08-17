-- ===================================================
-- GEOLOCATION SUPPORT MIGRATION
-- ===================================================
-- Purpose: Add precise geolocation coordinates to support nearby sellers feature
-- Date: $(date)
-- ===================================================

-- Add geolocation columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add geolocation columns to vegetables table for product-specific locations
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Create indexes for efficient geolocation queries
CREATE INDEX IF NOT EXISTS idx_users_coordinates ON users (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_city ON users (city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_location ON users (role, latitude, longitude) WHERE role = 'seller' AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vegetables_coordinates ON vegetables (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vegetables_owner_location ON vegetables (owner_id, latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create a function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10,8), 
    lon1 DECIMAL(11,8), 
    lat2 DECIMAL(10,8), 
    lon2 DECIMAL(11,8)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    R DECIMAL := 6371; -- Earth's radius in kilometers
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
    distance DECIMAL;
BEGIN
    -- Convert degrees to radians
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dLat/2) * sin(dLat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    distance := R * c;
    
    RETURN ROUND(distance::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to get nearby sellers within a specified radius
CREATE OR REPLACE FUNCTION get_nearby_sellers(
    user_lat DECIMAL(10,8),
    user_lon DECIMAL(11,8),
    radius_km DECIMAL DEFAULT 50
) RETURNS TABLE (
    seller_id UUID,
    seller_name VARCHAR(255),
    seller_email VARCHAR(255),
    seller_phone VARCHAR(20),
    seller_whatsapp VARCHAR(20),
    seller_address TEXT,
    seller_city VARCHAR(100),
    seller_latitude DECIMAL(10,8),
    seller_longitude DECIMAL(11,8),
    distance_km DECIMAL(10,2),
    product_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as seller_id,
        u.name as seller_name,
        u.email as seller_email,
        u.phone as seller_phone,
        u.whatsapp_number as seller_whatsapp,
        u.address as seller_address,
        u.city as seller_city,
        u.latitude as seller_latitude,
        u.longitude as seller_longitude,
        calculate_distance(user_lat, user_lon, u.latitude, u.longitude) as distance_km,
        COUNT(v.id) as product_count
    FROM users u
    LEFT JOIN vegetables v ON u.id = v.owner_id AND v.available = true
    WHERE u.role = 'seller'
        AND u.latitude IS NOT NULL 
        AND u.longitude IS NOT NULL
        AND calculate_distance(user_lat, user_lon, u.latitude, u.longitude) <= radius_km
    GROUP BY u.id, u.name, u.email, u.phone, u.whatsapp_number, u.address, u.city, u.latitude, u.longitude
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get nearby products within a specified radius
CREATE OR REPLACE FUNCTION get_nearby_products(
    user_lat DECIMAL(10,8),
    user_lon DECIMAL(11,8),
    radius_km DECIMAL DEFAULT 50
) RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR(255),
    product_description TEXT,
    product_price DECIMAL(10,2),
    product_quantity INTEGER,
    product_category VARCHAR(50),
    product_images TEXT[],
    seller_id UUID,
    seller_name VARCHAR(255),
    seller_phone VARCHAR(20),
    seller_whatsapp VARCHAR(20),
    distance_km DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as product_id,
        v.name as product_name,
        v.description as product_description,
        v.price as product_price,
        v.quantity as product_quantity,
        v.category as product_category,
        v.images as product_images,
        u.id as seller_id,
        u.name as seller_name,
        u.phone as seller_phone,
        u.whatsapp_number as seller_whatsapp,
        calculate_distance(user_lat, user_lon, 
            COALESCE(v.latitude, u.latitude), 
            COALESCE(v.longitude, u.longitude)
        ) as distance_km
    FROM vegetables v
    JOIN users u ON v.owner_id = u.id
    WHERE v.available = true
        AND u.role = 'seller'
        AND (v.latitude IS NOT NULL OR u.latitude IS NOT NULL)
        AND (v.longitude IS NOT NULL OR u.longitude IS NOT NULL)
        AND calculate_distance(user_lat, user_lon, 
            COALESCE(v.latitude, u.latitude), 
            COALESCE(v.longitude, u.longitude)
        ) <= radius_km
    ORDER BY distance_km ASC, v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN users.latitude IS 'User location latitude coordinate';
COMMENT ON COLUMN users.longitude IS 'User location longitude coordinate';
COMMENT ON COLUMN users.address IS 'Full formatted address';
COMMENT ON COLUMN users.city IS 'City name for quick filtering';
COMMENT ON COLUMN users.state IS 'State/Province name';
COMMENT ON COLUMN users.country IS 'Country name (defaults to India)';
COMMENT ON COLUMN users.postal_code IS 'ZIP/Postal code';
COMMENT ON COLUMN users.location_updated_at IS 'When location was last updated';

COMMENT ON FUNCTION calculate_distance IS 'Calculate distance between two coordinates using Haversine formula';
COMMENT ON FUNCTION get_nearby_sellers IS 'Get sellers within specified radius sorted by distance';
COMMENT ON FUNCTION get_nearby_products IS 'Get products within specified radius sorted by distance';
