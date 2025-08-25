-- ===================================================
-- NATURAL FARMING VERIFICATION SYSTEM ENHANCEMENT
-- ===================================================
-- Purpose: Enhance seller verification for natural farming practices
-- Features: Farm verification, trust badges, growing method validation
-- ===================================================

-- Add natural farming specific fields to seller_requests table
ALTER TABLE seller_requests 
ADD COLUMN IF NOT EXISTS farm_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS farm_description TEXT,
ADD COLUMN IF NOT EXISTS farming_methods TEXT[], -- Will be converted to enum array later
ADD COLUMN IF NOT EXISTS farm_size_acres DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS years_farming INTEGER,
ADD COLUMN IF NOT EXISTS certifications TEXT[], -- e.g., ['organic_certified', 'biodynamic', 'fair_trade']
ADD COLUMN IF NOT EXISTS farm_photos TEXT[], -- URLs to farm photos
ADD COLUMN IF NOT EXISTS growing_practices TEXT, -- Detailed description of growing practices
ADD COLUMN IF NOT EXISTS soil_management TEXT, -- Soil health and management practices  
ADD COLUMN IF NOT EXISTS pest_management TEXT, -- Natural pest control methods
ADD COLUMN IF NOT EXISTS water_source VARCHAR(100), -- Water source for irrigation
ADD COLUMN IF NOT EXISTS seasonal_calendar TEXT, -- What they grow in which seasons
ADD COLUMN IF NOT EXISTS verification_level VARCHAR(50) DEFAULT 'pending', -- pending, basic_verified, farm_verified, community_trusted
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0, -- 0-100 trust score
ADD COLUMN IF NOT EXISTS farm_visit_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS farm_visit_address TEXT,
ADD COLUMN IF NOT EXISTS preferred_visit_times TEXT;

-- Create farming_practices enum for standardization
DO $$ BEGIN
    CREATE TYPE farming_practice AS ENUM (
        'organic',
        'natural', 
        'pesticide_free',
        'chemical_free',
        'traditional',
        'biodynamic',
        'permaculture',
        'hydroponic_organic',
        'home_grown',
        'terrace_garden'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create verification_status enum
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending',
        'documents_submitted',
        'under_review',
        'basic_verified',
        'farm_verified',
        'community_trusted',
        'premium_verified',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update verification_level column to use enum
-- First, drop the default constraint
ALTER TABLE seller_requests ALTER COLUMN verification_level DROP DEFAULT;

-- Then change the column type
ALTER TABLE seller_requests 
ALTER COLUMN verification_level TYPE verification_status 
USING verification_level::verification_status;

-- Finally, set the new default value
ALTER TABLE seller_requests 
ALTER COLUMN verification_level SET DEFAULT 'pending'::verification_status;

-- Create seller_verification_badges table for tracking earned badges
CREATE TABLE IF NOT EXISTS seller_verification_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL, -- 'verified_natural', 'community_trusted', 'farm_visited', etc.
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    earned_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    verified_by UUID REFERENCES users(id), -- Admin/verifier who awarded badge
    verification_notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create product_reviews table for buyer feedback
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES vegetables(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Rating categories (1-5 scale)
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    freshness_rating INTEGER CHECK (freshness_rating >= 1 AND freshness_rating <= 5),
    natural_practice_rating INTEGER CHECK (natural_practice_rating >= 1 AND natural_practice_rating <= 5),
    seller_communication_rating INTEGER CHECK (seller_communication_rating >= 1 AND seller_communication_rating <= 5),
    
    -- Written feedback
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    
    -- Verification questions
    would_recommend BOOLEAN,
    verified_natural BOOLEAN, -- Did product seem naturally grown?
    packaging_quality INTEGER CHECK (packaging_quality >= 1 AND packaging_quality <= 5),
    
    -- Photos
    review_photos TEXT[], -- URLs to photos of received products
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    flagged BOOLEAN DEFAULT false,
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add natural farming related columns to vegetables table
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS farming_method VARCHAR(50) DEFAULT 'natural',
ADD COLUMN IF NOT EXISTS is_certified_organic BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certification_details TEXT,
ADD COLUMN IF NOT EXISTS growing_season VARCHAR(50), -- spring, summer, monsoon, winter, year_round
ADD COLUMN IF NOT EXISTS harvest_method VARCHAR(100), -- hand_picked, naturally_ripened, etc.
ADD COLUMN IF NOT EXISTS farm_fresh_guarantee BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pesticide_free_guarantee BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS days_to_harvest INTEGER, -- Days from harvest to delivery
ADD COLUMN IF NOT EXISTS storage_method TEXT, -- How product is stored
ADD COLUMN IF NOT EXISTS nutritional_benefits TEXT;

-- Create seller_farm_profiles table for detailed farm information
CREATE TABLE IF NOT EXISTS seller_farm_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Farm Identity
    farm_name VARCHAR(255) NOT NULL,
    farm_story TEXT, -- Personal story of the farmer
    established_year INTEGER,
    farm_type VARCHAR(50), -- home_garden, commercial_farm, community_garden, etc.
    
    -- Location & Size
    detailed_location TEXT,
    farm_coordinates TEXT, -- Latitude, longitude
    total_area_sqft INTEGER,
    cultivation_area_sqft INTEGER,
    
    -- Farming Philosophy
    farming_philosophy TEXT,
    sustainability_practices TEXT,
    community_involvement TEXT,
    
    -- Verification Status
    profile_verified BOOLEAN DEFAULT false,
    last_verification_date TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    
    -- Public Profile
    public_profile BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    farm_gallery_urls TEXT[], -- Multiple farm photos
    
    -- Contact & Visit Info
    visit_booking_enabled BOOLEAN DEFAULT false,
    visit_contact_info TEXT,
    visit_guidelines TEXT,
    
    -- Social Proof
    total_orders INTEGER DEFAULT 0,
    repeat_customers INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies for new tables
ALTER TABLE seller_verification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_farm_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for seller_verification_badges
CREATE POLICY "Anyone can view badges" ON seller_verification_badges
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage badges" ON seller_verification_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role IN ('admin', 'superadmin')
        )
    );

-- Policies for product_reviews  
CREATE POLICY "Anyone can view active reviews" ON product_reviews
    FOR SELECT USING (status = 'active' AND flagged = false);

CREATE POLICY "Buyers can create reviews for their orders" ON product_reviews
    FOR INSERT WITH CHECK (
        buyer_id::text = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_id 
            AND orders.user_id::text = auth.uid()::text
            AND orders.status = 'delivered'
        )
    );

CREATE POLICY "Users can update their own reviews" ON product_reviews
    FOR UPDATE USING (buyer_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all reviews" ON product_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role IN ('admin', 'superadmin')
        )
    );

-- Policies for seller_farm_profiles
CREATE POLICY "Anyone can view public farm profiles" ON seller_farm_profiles
    FOR SELECT USING (public_profile = true);

CREATE POLICY "Sellers can manage their own farm profile" ON seller_farm_profiles
    FOR ALL USING (seller_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all farm profiles" ON seller_farm_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role IN ('admin', 'superadmin')
        )
    );

-- Grant permissions
GRANT ALL ON seller_verification_badges TO authenticated;
GRANT SELECT ON seller_verification_badges TO anon;

GRANT ALL ON product_reviews TO authenticated; 
GRANT SELECT ON product_reviews TO anon;

GRANT ALL ON seller_farm_profiles TO authenticated;
GRANT SELECT ON seller_farm_profiles TO anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_verification_badges_seller_id ON seller_verification_badges(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_badges_badge_type ON seller_verification_badges(badge_type);

CREATE INDEX IF NOT EXISTS idx_product_reviews_seller_id ON product_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_overall_rating ON product_reviews(overall_rating);

CREATE INDEX IF NOT EXISTS idx_seller_farm_profiles_seller_id ON seller_farm_profiles(seller_id);
-- Create index for farming method (varchar for now, can be optimized later)
CREATE INDEX IF NOT EXISTS idx_vegetables_farming_method ON vegetables(farming_method);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🌱 Natural Farming Verification System Enhanced!';
    RAISE NOTICE '✅ Added farming methods and certification tracking';
    RAISE NOTICE '🏆 Created verification badges system';
    RAISE NOTICE '⭐ Added product review system with natural farming focus';
    RAISE NOTICE '🏡 Created detailed farm profiles';
    RAISE NOTICE '🔒 All security policies configured';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for natural farming marketplace launch!';
END $$;
