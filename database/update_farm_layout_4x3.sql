-- Update farm layout to 5 columns x 3 rows (15 blocks total)
UPDATE farm_layouts 
SET 
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
  name = 'Default Farm Layout - 5x3 Grid',
  description = '15-block layout (5x3 grid of 24x24 blocks)',
  updated_at = NOW();
