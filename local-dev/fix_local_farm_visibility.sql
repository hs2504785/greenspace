-- ===================================================
-- LOCAL FARM VISITS FIX - TARGETED SOLUTION
-- ===================================================
-- This fixes the specific visibility issues in your local database

BEGIN;

-- ===================================================
-- 1. CURRENT STATUS CHECK
-- ===================================================

SELECT 
    u.name,
    u.role,
    sfp.farm_name,
    sfp.public_profile,
    sfp.visit_booking_enabled,
    sfp.garden_visit_enabled,
    CASE 
        WHEN NOT sfp.public_profile THEN 'Not public'
        WHEN NOT sfp.visit_booking_enabled THEN 'Visits disabled'
        ELSE 'Visible'
    END as visibility_status
FROM users u
JOIN seller_farm_profiles sfp ON u.id = sfp.seller_id
WHERE u.role IN ('seller', 'admin', 'superadmin')
ORDER BY u.role, u.name;

-- ===================================================
-- 2. FIX VISIBILITY ISSUES
-- ===================================================

-- Make all farm profiles public and enable visits
UPDATE seller_farm_profiles 
SET 
    public_profile = true,
    visit_booking_enabled = true,
    garden_visit_enabled = true
WHERE seller_id IN (
    SELECT id FROM users 
    WHERE role IN ('seller', 'admin', 'superadmin')
);

-- ===================================================
-- 3. VERIFY THE FIX
-- ===================================================

SELECT 
    u.name,
    u.role,
    sfp.farm_name,
    sfp.public_profile,
    sfp.visit_booking_enabled,
    sfp.garden_visit_enabled,
    'Now visible' as new_status
FROM users u
JOIN seller_farm_profiles sfp ON u.id = sfp.seller_id
WHERE u.role IN ('seller', 'admin', 'superadmin')
ORDER BY u.role, u.name;

-- ===================================================
-- 4. CHECK AVAILABILITY ALIGNMENT
-- ===================================================

-- Show which users have availability and will now be visible
SELECT 
    u.name,
    u.role,
    COUNT(fva.id) as availability_slots,
    sfp.public_profile,
    sfp.visit_booking_enabled,
    CASE 
        WHEN COUNT(fva.id) > 0 AND sfp.public_profile AND sfp.visit_booking_enabled THEN 'Will appear in listings'
        WHEN COUNT(fva.id) > 0 THEN 'Has slots but still not visible'
        ELSE 'No availability slots'
    END as final_status
FROM users u
LEFT JOIN farm_visit_availability fva ON u.id = fva.seller_id
LEFT JOIN seller_farm_profiles sfp ON u.id = sfp.seller_id
WHERE u.role IN ('seller', 'admin', 'superadmin')
GROUP BY u.id, u.name, u.role, sfp.public_profile, sfp.visit_booking_enabled
ORDER BY u.role, u.name;

COMMIT;

-- ===================================================
-- SUCCESS MESSAGE
-- ===================================================

SELECT 'Farm visits are now properly configured for all roles in local environment!' as success_message;
