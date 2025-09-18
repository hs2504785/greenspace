-- ===================================================
-- SIMPLE FIX FOR FARM VISIT SYSTEM
-- ===================================================
-- Run this to add missing columns without complex constraints
-- ===================================================

-- Add missing columns to farm_visit_availability
ALTER TABLE farm_visit_availability 
ADD COLUMN IF NOT EXISTS visit_type VARCHAR(50) DEFAULT 'farm',
ADD COLUMN IF NOT EXISTS location_type VARCHAR(100) DEFAULT 'farm',
ADD COLUMN IF NOT EXISTS space_description TEXT,
ADD COLUMN IF NOT EXISTS activity_type VARCHAR(100) DEFAULT 'farm_tour',
ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- Add missing columns to seller_farm_profiles
ALTER TABLE seller_farm_profiles 
ADD COLUMN IF NOT EXISTS garden_visit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS garden_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS garden_size_sqft INTEGER,
ADD COLUMN IF NOT EXISTS garden_specialties TEXT[],
ADD COLUMN IF NOT EXISTS growing_methods TEXT[],
ADD COLUMN IF NOT EXISTS garden_features TEXT[];

-- Update any NULL visit_types to 'farm'
UPDATE farm_visit_availability 
SET visit_type = 'farm' 
WHERE visit_type IS NULL;

-- Enable farm and garden visits for existing seller profiles
UPDATE seller_farm_profiles 
SET visit_booking_enabled = true, garden_visit_enabled = true
WHERE seller_id IN (
    SELECT id FROM users 
    WHERE role IN ('seller', 'admin', 'superadmin')
);

-- Create seller farm profiles for admins and superadmins who don't have them yet
INSERT INTO seller_farm_profiles (
    seller_id,
    farm_name,
    farm_story,
    farm_type,
    detailed_location,
    farming_philosophy,
    visit_booking_enabled,
    garden_visit_enabled,
    public_profile,
    profile_verified
)
SELECT 
    u.id,
    COALESCE(u.name || '''s Farm', 'Admin Farm'),
    'Administrative farm for platform management and demonstrations',
    'admin_farm',
    u.location,
    'Platform administration and user support',
    true,
    true,
    false,
    true
FROM users u
WHERE u.role IN ('admin', 'superadmin')
AND NOT EXISTS (
    SELECT 1 FROM seller_farm_profiles sfp 
    WHERE sfp.seller_id = u.id
);

-- Basic indexes (PostgreSQL will ignore if they already exist)
CREATE INDEX IF NOT EXISTS idx_farm_visit_availability_seller_date 
ON farm_visit_availability(seller_id, date);

CREATE INDEX IF NOT EXISTS idx_farm_visit_availability_date_available 
ON farm_visit_availability(date, is_available);

CREATE INDEX IF NOT EXISTS idx_farm_visit_requests_user_id 
ON farm_visit_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_farm_visit_requests_seller_id 
ON farm_visit_requests(seller_id);

CREATE INDEX IF NOT EXISTS idx_farm_visit_requests_status 
ON farm_visit_requests(status);
