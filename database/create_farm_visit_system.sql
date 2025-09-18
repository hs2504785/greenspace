-- ===================================================
-- FARM VISIT REQUEST SYSTEM
-- ===================================================
-- Creates tables for farm visit requests and availability management
-- Run this script in Supabase SQL Editor
-- ===================================================

-- Farm Visit Availability Table
-- Sellers use this to set their available time slots
CREATE TABLE IF NOT EXISTS farm_visit_availability (
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
    visit_type VARCHAR(50) DEFAULT 'farm' CHECK (visit_type IN ('farm', 'garden')), -- farm or garden/terrace
    location_type VARCHAR(100) DEFAULT 'farm', -- farm, home_garden, terrace_garden, rooftop_garden
    space_description TEXT, -- Description of the space being visited
    
    -- Additional information
    special_notes TEXT,
    activity_type VARCHAR(100) DEFAULT 'farm_tour', -- farm_tour, garden_tour, harvesting, workshop, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraints
    UNIQUE(seller_id, date, start_time)
);

-- Farm Visit Requests Table
-- Users submit visit requests through this table
CREATE TABLE IF NOT EXISTS farm_visit_requests (
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
    purpose TEXT, -- Why they want to visit
    special_requirements TEXT, -- Any special needs or requests
    message_to_farmer TEXT,
    
    -- Status management
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    admin_notes TEXT, -- Notes from admin/seller
    rejection_reason TEXT,
    
    -- Approval workflow
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Farm Visit Reviews Table (optional for future)
CREATE TABLE IF NOT EXISTS farm_visit_reviews (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farm_visit_availability_seller_date ON farm_visit_availability(seller_id, date);
CREATE INDEX IF NOT EXISTS idx_farm_visit_availability_date ON farm_visit_availability(date);
CREATE INDEX IF NOT EXISTS idx_farm_visit_requests_user_id ON farm_visit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_visit_requests_seller_id ON farm_visit_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_farm_visit_requests_status ON farm_visit_requests(status);
CREATE INDEX IF NOT EXISTS idx_farm_visit_requests_date ON farm_visit_requests(requested_date);

-- ===================================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================================

-- Enable RLS on all tables
ALTER TABLE farm_visit_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_visit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_visit_reviews ENABLE ROW LEVEL SECURITY;

-- Farm Visit Availability Policies
CREATE POLICY "Sellers can manage their own availability" ON farm_visit_availability
    FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Anyone can view available slots" ON farm_visit_availability
    FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage all availability" ON farm_visit_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Farm Visit Requests Policies
CREATE POLICY "Users can view their own requests" ON farm_visit_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create requests" ON farm_visit_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending requests" ON farm_visit_requests
    FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Sellers can view requests for their farm" ON farm_visit_requests
    FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update requests for their farm" ON farm_visit_requests
    FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all requests" ON farm_visit_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Farm Visit Reviews Policies
CREATE POLICY "Users can view all reviews" ON farm_visit_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their completed visits" ON farm_visit_reviews
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM farm_visit_requests 
            WHERE id = request_id 
            AND user_id = auth.uid() 
            AND status = 'completed'
        )
    );

CREATE POLICY "Users can update their own reviews" ON farm_visit_reviews
    FOR UPDATE USING (user_id = auth.uid());

-- ===================================================
-- DEFAULT AVAILABILITY SETUP FUNCTION
-- ===================================================

-- Function to help sellers set up default weekly availability
CREATE OR REPLACE FUNCTION setup_default_availability(
    seller_uuid UUID,
    start_date DATE,
    end_date DATE,
    daily_slots JSONB DEFAULT '[{"start_time": "09:00", "end_time": "11:00"}, {"start_time": "14:00", "end_time": "16:00"}]'::JSONB
)
RETURNS VOID AS $$
DECLARE
    loop_date DATE := start_date;
    slot JSONB;
BEGIN
    WHILE loop_date <= end_date LOOP
        -- Skip Sundays (day of week = 0)
        IF EXTRACT(DOW FROM loop_date) != 0 THEN
            FOR slot IN SELECT * FROM jsonb_array_elements(daily_slots)
            LOOP
                INSERT INTO farm_visit_availability (
                    seller_id,
                    date,
                    start_time,
                    end_time,
                    is_available,
                    max_visitors
                ) VALUES (
                    seller_uuid,
                    loop_date,
                    (slot->>'start_time')::TIME,
                    (slot->>'end_time')::TIME,
                    true,
                    5
                ) ON CONFLICT (seller_id, date, start_time) DO NOTHING;
            END LOOP;
        END IF;
        loop_date := loop_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ===================================================

-- Function to update booking count when requests are approved/cancelled
CREATE OR REPLACE FUNCTION update_availability_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new approved request)
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' AND NEW.availability_id IS NOT NULL THEN
        UPDATE farm_visit_availability 
        SET current_bookings = current_bookings + NEW.number_of_visitors
        WHERE id = NEW.availability_id;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (status change)
    IF TG_OP = 'UPDATE' AND NEW.availability_id IS NOT NULL THEN
        -- If request was approved, increase booking count
        IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
            UPDATE farm_visit_availability 
            SET current_bookings = current_bookings + NEW.number_of_visitors
            WHERE id = NEW.availability_id;
        -- If approved request was cancelled/rejected, decrease booking count
        ELSIF OLD.status = 'approved' AND NEW.status IN ('cancelled', 'rejected') THEN
            UPDATE farm_visit_availability 
            SET current_bookings = GREATEST(0, current_bookings - OLD.number_of_visitors)
            WHERE id = NEW.availability_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (remove approved request)
    IF TG_OP = 'DELETE' AND OLD.status = 'approved' AND OLD.availability_id IS NOT NULL THEN
        UPDATE farm_visit_availability 
        SET current_bookings = GREATEST(0, current_bookings - OLD.number_of_visitors)
        WHERE id = OLD.availability_id;
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_availability_booking_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON farm_visit_requests
    FOR EACH ROW EXECUTE FUNCTION update_availability_booking_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_farm_visit_availability_updated_at
    BEFORE UPDATE ON farm_visit_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farm_visit_requests_updated_at
    BEFORE UPDATE ON farm_visit_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- ENHANCE SELLER FARM PROFILES FOR GARDEN VISITS
-- ===================================================

-- Add garden visit support to seller farm profiles
ALTER TABLE seller_farm_profiles 
ADD COLUMN IF NOT EXISTS garden_visit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS garden_type VARCHAR(100), -- home_garden, terrace_garden, rooftop_garden, community_garden
ADD COLUMN IF NOT EXISTS garden_size_sqft INTEGER,
ADD COLUMN IF NOT EXISTS garden_specialties TEXT[], -- vegetables, herbs, flowers, fruits
ADD COLUMN IF NOT EXISTS growing_methods TEXT[], -- organic, hydroponic, container, vertical
ADD COLUMN IF NOT EXISTS garden_features TEXT[]; -- greenhouse, shade_net, drip_irrigation, composting

-- ===================================================
-- ENABLE FARM VISITS FOR ELIGIBLE USERS
-- ===================================================

-- Enable farm and garden visits for sellers, admins, and superadmins
UPDATE seller_farm_profiles 
SET visit_booking_enabled = true, garden_visit_enabled = true
WHERE seller_id IN (
    SELECT id FROM users 
    WHERE role IN ('seller', 'admin', 'superadmin')
);

-- Create seller farm profiles for admins and superadmins who don't have them yet
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
    false, -- Not public by default for admin accounts
    true
FROM users u
WHERE u.role IN ('admin', 'superadmin')
AND NOT EXISTS (
    SELECT 1 FROM seller_farm_profiles sfp 
    WHERE sfp.seller_id = u.id
);

-- ===================================================
-- COMMIT TRANSACTION
-- ===================================================

COMMIT;
