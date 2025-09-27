-- ===================================================
-- FARM VISITS: ENSURE ALL ROLES WORK PROPERLY
-- ===================================================
-- This script ensures farm visits work for superadmin, admin, and seller roles

BEGIN;

-- ===================================================
-- 1. CREATE MISSING FARM PROFILES FOR ALL ROLES
-- ===================================================

-- Create farm profiles for admins and superadmins who don't have them
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
    COALESCE(u.location, 'Platform Administration'),
    'Platform administration and user support',
    true,
    true,
    true, -- Make public so they appear in listings
    true
FROM users u
WHERE u.role IN ('admin', 'superadmin')
AND NOT EXISTS (
    SELECT 1 FROM seller_farm_profiles sfp 
    WHERE sfp.seller_id = u.id
)
ON CONFLICT (seller_id) DO NOTHING;

-- ===================================================
-- 2. UPDATE EXISTING PROFILES FOR ALL ROLES
-- ===================================================

-- Enable farm visits for all sellers, admins, and superadmins
UPDATE seller_farm_profiles 
SET 
    visit_booking_enabled = true, 
    garden_visit_enabled = true,
    public_profile = CASE 
        WHEN seller_id IN (
            SELECT id FROM users WHERE role = 'seller'
        ) THEN true  -- Always public for sellers
        WHEN seller_id IN (
            SELECT id FROM users WHERE role IN ('admin', 'superadmin')
        ) THEN true  -- Make admin/superadmin public too for testing
        ELSE public_profile  -- Keep existing setting for others
    END
WHERE seller_id IN (
    SELECT id FROM users 
    WHERE role IN ('seller', 'admin', 'superadmin')
);

-- ===================================================
-- 3. SPECIFIC FIX FOR ARYA NATURAL FARMS
-- ===================================================

-- Fix the specific case mentioned in the issue
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
) VALUES (
    '17f057c9-8f25-4980-a6d4-faa700dad16c',
    'Arya Natural Farms',
    'Fresh, natural, and local produce from our sustainable farm',
    'natural_farm',
    'Local farming area',
    'We believe in natural farming practices that work with nature',
    true,
    true,
    true,
    true
) ON CONFLICT (seller_id) DO UPDATE SET
    public_profile = true,
    visit_booking_enabled = true,
    garden_visit_enabled = true,
    farm_name = COALESCE(NULLIF(seller_farm_profiles.farm_name, ''), 'Arya Natural Farms');

-- ===================================================
-- 4. VERIFY SETUP
-- ===================================================

-- Show all users with farm profiles and their settings
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    sfp.farm_name,
    sfp.public_profile,
    sfp.visit_booking_enabled,
    sfp.garden_visit_enabled,
    sfp.profile_verified
FROM users u
LEFT JOIN seller_farm_profiles sfp ON u.id = sfp.seller_id
WHERE u.role IN ('seller', 'admin', 'superadmin')
ORDER BY u.role, u.name;

-- Show availability counts by user
SELECT 
    u.name,
    u.role,
    COUNT(fva.id) as availability_slots
FROM users u
LEFT JOIN farm_visit_availability fva ON u.id = fva.seller_id
WHERE u.role IN ('seller', 'admin', 'superadmin')
GROUP BY u.id, u.name, u.role
ORDER BY u.role, u.name;

COMMIT;

-- ===================================================
-- VERIFICATION QUERIES
-- ===================================================

-- Run these after the script to verify everything works:

-- 1. Check all farm profiles are properly configured
-- SELECT 
--     u.name, u.role, sfp.public_profile, sfp.visit_booking_enabled 
-- FROM users u 
-- JOIN seller_farm_profiles sfp ON u.id = sfp.seller_id 
-- WHERE u.role IN ('seller', 'admin', 'superadmin');

-- 2. Test the farms API query (what the frontend uses)
-- SELECT 
--     u.id, u.name, u.role,
--     sfp.farm_name, sfp.public_profile, sfp.visit_booking_enabled
-- FROM users u
-- JOIN seller_farm_profiles sfp ON u.id = sfp.seller_id
-- WHERE u.role IN ('seller', 'admin', 'superadmin')
-- AND sfp.public_profile = true
-- AND (sfp.visit_booking_enabled = true OR sfp.garden_visit_enabled = true);

-- 3. Check availability data
-- SELECT 
--     u.name, u.role, fva.date, fva.start_time, fva.end_time, fva.is_available
-- FROM users u
-- JOIN farm_visit_availability fva ON u.id = fva.seller_id
-- WHERE u.role IN ('seller', 'admin', 'superadmin')
-- ORDER BY u.role, fva.date, fva.start_time;
