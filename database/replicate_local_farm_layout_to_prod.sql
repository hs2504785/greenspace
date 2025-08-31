-- ===================================================
-- REPLICATE LOCAL FARM LAYOUT TO PRODUCTION
-- ===================================================
-- This script replicates your exact local farm layout setup
-- Based on your local data structure
-- ===================================================

-- Create the exact same farm layout for any admin/superadmin user in production
INSERT INTO farm_layouts (farm_id, name, description, grid_config, is_active)
SELECT 
    u.id as farm_id,
    'Default Farm Layout - 5x3 Grid' as name,
    '15-block layout (5x3 grid of 24x24 blocks)' as description,
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
    }'::jsonb as grid_config,
    true as is_active
FROM users u
WHERE u.role IN ('admin', 'superadmin')
  AND NOT EXISTS (
    SELECT 1 FROM farm_layouts fl 
    WHERE fl.farm_id = u.id 
      AND fl.name = 'Default Farm Layout - 5x3 Grid'
  )
ORDER BY u.created_at DESC;

-- Verify the layout was created
SELECT 
    'FARM LAYOUT CREATED SUCCESSFULLY!' as status,
    fl.id,
    fl.name,
    u.email as owner_email,
    u.role,
    jsonb_array_length(fl.grid_config->'blocks') as block_count,
    fl.is_active,
    fl.created_at
FROM farm_layouts fl
JOIN users u ON fl.farm_id = u.id
WHERE fl.name = 'Default Farm Layout - 5x3 Grid'
ORDER BY fl.created_at DESC;
