-- Safe Seller System Setup
-- This migration creates the seller_requests table and related functionality
-- Handles existing tables and policies gracefully

-- Create seller_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS seller_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_description TEXT,
    location TEXT,
    contact_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    documents TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    
    -- Enhanced natural farming fields
    farm_name VARCHAR(255),
    farm_description TEXT,
    farming_methods TEXT[],
    farm_size_acres DECIMAL(10,2),
    years_farming INTEGER,
    certifications TEXT[],
    farm_photos TEXT[],
    growing_practices TEXT,
    soil_management TEXT,
    pest_management TEXT,
    water_source VARCHAR(100),
    seasonal_calendar TEXT,
    verification_level VARCHAR(50) DEFAULT 'pending',
    trust_score INTEGER DEFAULT 0,
    farm_visit_available BOOLEAN DEFAULT false,
    farm_visit_address TEXT,
    preferred_visit_times TEXT
);

-- Add enhanced fields to existing table if they don't exist
ALTER TABLE seller_requests 
ADD COLUMN IF NOT EXISTS farm_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS farm_description TEXT,
ADD COLUMN IF NOT EXISTS farming_methods TEXT[],
ADD COLUMN IF NOT EXISTS farm_size_acres DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS years_farming INTEGER,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS farm_photos TEXT[],
ADD COLUMN IF NOT EXISTS growing_practices TEXT,
ADD COLUMN IF NOT EXISTS soil_management TEXT,
ADD COLUMN IF NOT EXISTS pest_management TEXT,
ADD COLUMN IF NOT EXISTS water_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS seasonal_calendar TEXT,
ADD COLUMN IF NOT EXISTS verification_level VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS farm_visit_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS farm_visit_address TEXT,
ADD COLUMN IF NOT EXISTS preferred_visit_times TEXT;

-- Create seller_farm_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS seller_farm_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    farm_name VARCHAR(255),
    farm_story TEXT,
    farm_type VARCHAR(100) DEFAULT 'natural_farm',
    detailed_location TEXT,
    farming_philosophy TEXT,
    sustainability_practices TEXT,
    visit_booking_enabled BOOLEAN DEFAULT false,
    visit_contact_info TEXT,
    public_profile BOOLEAN DEFAULT true,
    farm_gallery_urls TEXT[],
    profile_verified BOOLEAN DEFAULT false,
    last_verification_date TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create seller_verification_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS seller_verification_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(100) NOT NULL,
    badge_name VARCHAR(255) NOT NULL,
    badge_description TEXT,
    verified_by UUID REFERENCES users(id),
    verification_notes TEXT,
    active BOOLEAN DEFAULT true,
    earned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_requests_user_id ON seller_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_requests_status ON seller_requests(status);
CREATE INDEX IF NOT EXISTS idx_seller_requests_created_at ON seller_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_farm_profiles_seller_id ON seller_farm_profiles(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_badges_seller_id ON seller_verification_badges(seller_id);

-- Enable RLS on seller_requests
ALTER TABLE seller_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own requests" ON seller_requests;
DROP POLICY IF EXISTS "Users can create requests" ON seller_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON seller_requests;
DROP POLICY IF EXISTS "Sellers can update requests" ON seller_requests;

-- Create RLS policies for seller_requests
CREATE POLICY "Users can view their own requests" ON seller_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create requests" ON seller_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all requests" ON seller_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

CREATE POLICY "Admins can update requests" ON seller_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Enable RLS on seller_farm_profiles
ALTER TABLE seller_farm_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for seller_farm_profiles
DROP POLICY IF EXISTS "Sellers can manage own profiles" ON seller_farm_profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON seller_farm_profiles;

-- Create RLS policies for seller_farm_profiles
CREATE POLICY "Sellers can manage own profiles" ON seller_farm_profiles
    FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Public can view profiles" ON seller_farm_profiles
    FOR SELECT USING (public_profile = true);

-- Enable RLS on seller_verification_badges
ALTER TABLE seller_verification_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for seller_verification_badges
DROP POLICY IF EXISTS "Sellers can view own badges" ON seller_verification_badges;
DROP POLICY IF EXISTS "Public can view badges" ON seller_verification_badges;
DROP POLICY IF EXISTS "Admins can manage badges" ON seller_verification_badges;

-- Create RLS policies for seller_verification_badges
CREATE POLICY "Sellers can view own badges" ON seller_verification_badges
    FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Public can view badges" ON seller_verification_badges
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage badges" ON seller_verification_badges
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Grant permissions to service role
GRANT ALL ON seller_requests TO service_role;
GRANT ALL ON seller_farm_profiles TO service_role;
GRANT ALL ON seller_verification_badges TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Success message
SELECT 'Seller system migration completed successfully!' as result;
