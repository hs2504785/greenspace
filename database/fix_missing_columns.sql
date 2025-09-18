-- ===================================================
-- FIX MISSING COLUMNS IN FARM VISIT SYSTEM
-- ===================================================
-- Run this if basic tables exist but some columns are missing
-- ===================================================

-- Add missing columns to farm_visit_availability if they don't exist
ALTER TABLE farm_visit_availability 
ADD COLUMN IF NOT EXISTS visit_type VARCHAR(50) DEFAULT 'farm',
ADD COLUMN IF NOT EXISTS location_type VARCHAR(100) DEFAULT 'farm',
ADD COLUMN IF NOT EXISTS space_description TEXT,
ADD COLUMN IF NOT EXISTS activity_type VARCHAR(100) DEFAULT 'farm_tour',
ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- Add missing columns to seller_farm_profiles if they don't exist
ALTER TABLE seller_farm_profiles 
ADD COLUMN IF NOT EXISTS garden_visit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS garden_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS garden_size_sqft INTEGER,
ADD COLUMN IF NOT EXISTS garden_specialties TEXT[],
ADD COLUMN IF NOT EXISTS growing_methods TEXT[],
ADD COLUMN IF NOT EXISTS garden_features TEXT[];

-- Add missing constraints (only if not exists)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE farm_visit_availability 
        ADD CONSTRAINT check_visit_type CHECK (visit_type IN ('farm', 'garden'));
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

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

-- Create indexes if they don't exist
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
