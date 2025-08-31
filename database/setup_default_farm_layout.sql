-- ===================================================
-- SETUP DEFAULT FARM LAYOUT FOR ADMIN USER
-- ===================================================
-- Run this AFTER creating tree management tables
-- Replace the user ID with your actual admin/superadmin user ID

-- Step 1: Find your admin user (run this first to get the ID)
SELECT 
    id as user_id, 
    email, 
    role,
    'Copy this ID and use it in Step 2 below' as instruction
FROM users 
WHERE role IN ('admin', 'superadmin') 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: Create default farm layout 
-- IMPORTANT: Replace 'YOUR_ADMIN_USER_ID_HERE' with actual ID from Step 1
/*
INSERT INTO farm_layouts (farm_id, name, description, grid_config) 
VALUES (
  'YOUR_ADMIN_USER_ID_HERE'::uuid, 
  'Default Farm Layout - 5x3 Grid', 
  '15-block layout (5x3 grid of 24x24 blocks)',
  '{
    "blocks": [
      {"x": 0, "y": 0, "width": 24, "height": 24},
      {"x": 24, "y": 0, "width": 24, "height": 24},
      {"x": 48, "y": 0, "width": 24, "height": 24},
      {"x": 72, "y": 0, "width": 24, "height": 24},
      {"x": 96, "y": 0, "width": 24, "height": 24},
      {"x": 0, "y": 24, "width": 24, "height": 24},
      {"x": 24, "y": 24, "width": 24, "height": 24},
      {"x": 48, "y": 24, "width": 24, "height": 24},
      {"x": 72, "y": 24, "width": 24, "height": 24},
      {"x": 96, "y": 24, "width": 24, "height": 24},
      {"x": 0, "y": 48, "width": 24, "height": 24},
      {"x": 24, "y": 48, "width": 24, "height": 24},
      {"x": 48, "y": 48, "width": 24, "height": 24},
      {"x": 72, "y": 48, "width": 24, "height": 24},
      {"x": 96, "y": 48, "width": 24, "height": 24}
    ]
  }'::jsonb
);
*/

-- Step 3: Verify the layout was created
SELECT 
    fl.id,
    fl.name,
    fl.description,
    u.email as owner_email,
    jsonb_array_length(fl.grid_config->'blocks') as block_count
FROM farm_layouts fl
JOIN users u ON fl.farm_id = u.id
ORDER BY fl.created_at DESC;
