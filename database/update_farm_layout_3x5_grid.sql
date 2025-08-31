-- ===================================================
-- UPDATE FARM LAYOUT TO 3 ROWS × 5 COLUMNS GRID
-- ===================================================
-- Updates existing farm layouts to match local 3x5 configuration
-- 3 rows, 5 columns = 15 blocks total (same as before but different arrangement)
-- ===================================================

-- Update existing farm layouts to 3 rows × 5 columns configuration
UPDATE farm_layouts 
SET 
    name = 'Default Farm Layout - 3x5 Grid',
    description = '15-block layout (3 rows × 5 columns of 24x24 blocks)',
    grid_config = '{
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
    }'::jsonb,
    updated_at = NOW()
WHERE farm_id IN (
    SELECT id FROM users WHERE role IN ('admin', 'superadmin')
);

-- Verify the updated layout
SELECT 
    'FARM LAYOUT UPDATED TO 3x5 GRID!' as status,
    fl.id,
    fl.name,
    fl.description,
    u.email as owner_email,
    u.role,
    jsonb_array_length(fl.grid_config->'blocks') as total_blocks,
    fl.is_active,
    fl.updated_at
FROM farm_layouts fl
JOIN users u ON fl.farm_id = u.id
WHERE fl.name LIKE '%3x5%'
ORDER BY fl.updated_at DESC;

-- Show grid layout structure for verification
SELECT 
    'GRID STRUCTURE VERIFICATION:' as info,
    'Row 1: Blocks 1-5 (y=0, x=0,24,48,72,96)' as row_1,
    'Row 2: Blocks 6-10 (y=24, x=0,24,48,72,96)' as row_2,
    'Row 3: Blocks 11-15 (y=48, x=0,24,48,72,96)' as row_3,
    'Total Farm Size: 120ft wide × 72ft deep' as dimensions;
