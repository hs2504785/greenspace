-- ===================================================
-- FARM VISITS: LOCAL ENVIRONMENT FIX
-- ===================================================
-- This script ensures farm visits work for all roles in LOCAL environment
-- It handles cases where production user IDs don't exist locally

BEGIN;

-- ===================================================
-- 1. CHECK EXISTING USERS AND THEIR ROLES
-- ===================================================

-- First, let's see what users we have locally
SELECT 
    id, 
    name, 
    email, 
    role,
    'Existing user' as status
FROM users 
WHERE role IN ('seller', 'admin', 'superadmin')
ORDER BY role, name;

-- ===================================================
-- 2. CREATE MISSING FARM PROFILES FOR EXISTING USERS
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
-- 3. UPDATE EXISTING PROFILES FOR ALL ROLES
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
-- 4. CREATE SAMPLE USERS IF NEEDED (OPTIONAL)
-- ===================================================

-- If you want to create sample users for testing, uncomment this section:
/*
-- Create sample superadmin if none exists
INSERT INTO users (
    id,
    name,
    email,
    role,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Local Superadmin',
    'superadmin@local.test',
    'superadmin'::user_role,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'superadmin'
);

-- Create sample admin if none exists  
INSERT INTO users (
    id,
    name,
    email,
    role,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Local Admin',
    'admin@local.test', 
    'admin'::user_role,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'admin'
);

-- Create sample seller if none exists
INSERT INTO users (
    id,
    name,
    email,
    role,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Local Seller',
    'seller@local.test',
    'seller'::user_role,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'seller'
);
*/

-- ===================================================
-- 5. HANDLE AVAILABILITY DATA
-- ===================================================

-- Check if there are any availability records without matching farm profiles
SELECT 
    fva.id as availability_id,
    fva.seller_id,
    u.name as seller_name,
    u.role as seller_role,
    CASE 
        WHEN sfp.id IS NULL THEN 'Missing farm profile'
        WHEN NOT sfp.public_profile THEN 'Profile not public'
        WHEN NOT sfp.visit_booking_enabled THEN 'Visits not enabled'
        ELSE 'OK'
    END as status
FROM farm_visit_availability fva
LEFT JOIN users u ON fva.seller_id = u.id
LEFT JOIN seller_farm_profiles sfp ON fva.seller_id = sfp.seller_id
ORDER BY u.role, u.name;

-- ===================================================
-- 6. VERIFY FINAL SETUP
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
    sfp.profile_verified,
    CASE 
        WHEN sfp.id IS NULL THEN 'No profile'
        WHEN NOT sfp.public_profile THEN 'Not public'
        WHEN NOT sfp.visit_booking_enabled THEN 'Visits disabled'
        ELSE 'Ready'
    END as farm_status
FROM users u
LEFT JOIN seller_farm_profiles sfp ON u.id = sfp.seller_id
WHERE u.role IN ('seller', 'admin', 'superadmin')
ORDER BY u.role, u.name;

-- Show availability counts by user
SELECT 
    u.name,
    u.role,
    COUNT(fva.id) as availability_slots,
    CASE 
        WHEN COUNT(fva.id) > 0 AND sfp.public_profile AND sfp.visit_booking_enabled THEN 'Visible'
        WHEN COUNT(fva.id) > 0 THEN 'Has slots but not visible'
        ELSE 'No slots'
    END as visibility_status
FROM users u
LEFT JOIN farm_visit_availability fva ON u.id = fva.seller_id
LEFT JOIN seller_farm_profiles sfp ON u.id = sfp.seller_id
WHERE u.role IN ('seller', 'admin', 'superadmin')
GROUP BY u.id, u.name, u.role, sfp.public_profile, sfp.visit_booking_enabled
ORDER BY u.role, u.name;

COMMIT;

-- ===================================================
-- POST-EXECUTION INSTRUCTIONS
-- ===================================================

-- After running this script:
-- 1. Check the output tables above to see your local users
-- 2. If you need to create availability for testing, use the management UI
-- 3. Test the farm visits page to ensure farms appear
-- 4. Run the test script: node scripts/test-farm-visits-all-roles.js
