-- ===================================================
-- QUICK FIX FOR FARM VISIT SYSTEM
-- ===================================================
-- Run this to fix common issues and ensure tables exist
-- ===================================================

-- Drop and recreate tables to ensure clean state
DROP TABLE IF EXISTS farm_visit_reviews CASCADE;
DROP TABLE IF EXISTS farm_visit_requests CASCADE;
DROP TABLE IF EXISTS farm_visit_availability CASCADE;

-- Create farm_visit_availability table
CREATE TABLE farm_visit_availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Date and time information
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability status
    is_available BOOLEAN DEFAULT true,
    max_visitors INTEGER DEFAULT 5,
    current_bookings INTEGER DEFAULT 0,
    
    -- Pricing (optional)
    price_per_person DECIMAL(10,2) DEFAULT 0,
    
    -- Visit type and location information
    visit_type VARCHAR(50) DEFAULT 'farm' CHECK (visit_type IN ('farm', 'garden')),
    location_type VARCHAR(100) DEFAULT 'farm',
    space_description TEXT,
    
    -- Additional information
    special_notes TEXT,
    activity_type VARCHAR(100) DEFAULT 'farm_tour',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraints
    UNIQUE(seller_id, date, start_time)
);

-- Create farm_visit_requests table
CREATE TABLE farm_visit_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Request details
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    availability_id UUID REFERENCES farm_visit_availability(id) ON DELETE SET NULL,
    
    -- Visit information
    requested_date DATE NOT NULL,
    requested_time_start TIME NOT NULL,
    requested_time_end TIME NOT NULL,
    number_of_visitors INTEGER DEFAULT 1,
    
    -- Contact information
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_email VARCHAR(255),
    
    -- Request details
    purpose TEXT,
    special_requirements TEXT,
    message_to_farmer TEXT,
    
    -- Status management
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Approval workflow
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create farm_visit_reviews table
CREATE TABLE farm_visit_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES farm_visit_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Review details
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    visit_highlights TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_farm_visit_availability_seller_date ON farm_visit_availability(seller_id, date);
CREATE INDEX idx_farm_visit_availability_date_available ON farm_visit_availability(date, is_available);
CREATE INDEX idx_farm_visit_requests_user_id ON farm_visit_requests(user_id);
CREATE INDEX idx_farm_visit_requests_seller_id ON farm_visit_requests(seller_id);
CREATE INDEX idx_farm_visit_requests_status ON farm_visit_requests(status);

-- Enable RLS (Row Level Security)
ALTER TABLE farm_visit_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_visit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_visit_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for farm_visit_availability
CREATE POLICY "Users can view all available slots" ON farm_visit_availability
    FOR SELECT USING (is_available = true);

CREATE POLICY "Sellers can manage their own availability" ON farm_visit_availability
    FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all availability" ON farm_visit_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Create RLS policies for farm_visit_requests
CREATE POLICY "Users can view their own requests" ON farm_visit_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own requests" ON farm_visit_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sellers can view requests for their farm" ON farm_visit_requests
    FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update requests for their farm" ON farm_visit_requests
    FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Admins can view all requests" ON farm_visit_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admins can update all requests" ON farm_visit_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Add garden visit columns to seller_farm_profiles if missing
ALTER TABLE seller_farm_profiles 
ADD COLUMN IF NOT EXISTS garden_visit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS garden_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS garden_size_sqft INTEGER,
ADD COLUMN IF NOT EXISTS garden_specialties TEXT[],
ADD COLUMN IF NOT EXISTS growing_methods TEXT[],
ADD COLUMN IF NOT EXISTS garden_features TEXT[];

-- Enable farm and garden visits for existing users
UPDATE seller_farm_profiles 
SET visit_booking_enabled = true, garden_visit_enabled = true
WHERE seller_id IN (
    SELECT id FROM users 
    WHERE role IN ('seller', 'admin', 'superadmin')
);

-- Create seller farm profiles for admins/superadmins if they don't exist
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
    u.location,
    'Platform administration and user support',
    true,
    true,
    false,
    true
FROM users u
WHERE u.role IN ('admin', 'superadmin')
AND NOT EXISTS (
    SELECT 1 FROM seller_farm_profiles sfp 
    WHERE sfp.seller_id = u.id
);

-- Grant necessary permissions
GRANT ALL ON farm_visit_availability TO authenticated;
GRANT ALL ON farm_visit_requests TO authenticated;
GRANT ALL ON farm_visit_reviews TO authenticated;
