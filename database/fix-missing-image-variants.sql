-- Fix Missing Image Variants in Database
-- This script updates products that only have medium variants stored in the database
-- but have all 3 variants (thumbnail, medium, large) in Supabase Storage

-- First, let's see what we're working with
-- SELECT id, name, images FROM vegetables WHERE array_length(images, 1) = 1 AND images[1] LIKE '%_medium.webp';

-- Update products that only have medium variant in database but should have all 3
UPDATE vegetables 
SET images = ARRAY[
  -- Construct thumbnail URL
  replace(images[1], '_medium.webp', '_thumbnail.webp'),
  -- Keep existing medium URL
  images[1],
  -- Construct large URL  
  replace(images[1], '_medium.webp', '_large.webp')
],
updated_at = NOW()
WHERE 
  -- Only products with exactly 1 image
  array_length(images, 1) = 1 
  -- And that image is a medium variant
  AND images[1] LIKE '%_medium.webp'
  -- Make sure it's a Supabase URL (safety check)
  AND images[1] LIKE '%supabase.co%';

-- Verify the update
-- SELECT id, name, images FROM vegetables WHERE array_length(images, 1) = 3 AND images[2] LIKE '%_medium.webp';
