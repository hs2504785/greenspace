-- =============================================================================
-- VEGETABLE PREBOOKING SYSTEM DATABASE SCHEMA
-- =============================================================================
-- This script creates the complete database schema for the vegetable prebooking
-- and demand management system.
-- =============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS vegetable_prebookings CASCADE;
DROP TABLE IF EXISTS vegetable_requests CASCADE;
DROP VIEW IF EXISTS vegetable_demand_view CASCADE;

-- =============================================================================
-- 1. VEGETABLE REQUESTS TABLE
-- =============================================================================
-- This table stores customer requests for vegetables that are not currently available
CREATE TABLE vegetable_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vegetable_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Leafy', 'Root', 'Fruit', 'Herbs', 'Vegetable', 'Spices')),
    requested_by UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    preferred_location TEXT,
    target_season TEXT CHECK (target_season IN ('Spring', 'Summer', 'Monsoon', 'Winter', 'Year-round')),
    urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. VEGETABLE PREBOOKINGS TABLE  
-- =============================================================================
-- This table stores actual prebookings/advance orders from customers to sellers
CREATE TABLE vegetable_prebookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    vegetable_request_id UUID REFERENCES vegetable_requests(id) ON DELETE SET NULL,
    
    -- Product details
    vegetable_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'grams', 'pieces', 'bunches')),
    
    -- Pricing
    estimated_price DECIMAL(10,2) CHECK (estimated_price >= 0),
    final_price DECIMAL(10,2) CHECK (final_price >= 0),
    
    -- Timing
    target_date DATE NOT NULL,
    estimated_harvest_date DATE,
    actual_delivery_date DATE,
    
    -- Status and communication
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'ready', 'delivered', 'rejected', 'cancelled')),
    user_notes TEXT,
    seller_notes TEXT,
    admin_notes TEXT,
    
    -- Confidence and fulfillment
    seller_confidence_level INTEGER DEFAULT 80 CHECK (seller_confidence_level BETWEEN 1 AND 100),
    fulfillment_probability DECIMAL(5,2) DEFAULT 85.00 CHECK (fulfillment_probability BETWEEN 0 AND 100),
    
    -- Payment
    advance_payment_required BOOLEAN DEFAULT false,
    advance_amount DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Vegetable Requests Indexes
CREATE INDEX idx_vegetable_requests_status ON vegetable_requests(status);
CREATE INDEX idx_vegetable_requests_category ON vegetable_requests(category);
CREATE INDEX idx_vegetable_requests_user ON vegetable_requests(requested_by);
CREATE INDEX idx_vegetable_requests_name ON vegetable_requests(vegetable_name);
CREATE INDEX idx_vegetable_requests_created_at ON vegetable_requests(created_at DESC);

-- Vegetable Prebookings Indexes
CREATE INDEX idx_vegetable_prebookings_user ON vegetable_prebookings(user_id);
CREATE INDEX idx_vegetable_prebookings_seller ON vegetable_prebookings(seller_id);
CREATE INDEX idx_vegetable_prebookings_status ON vegetable_prebookings(status);
CREATE INDEX idx_vegetable_prebookings_target_date ON vegetable_prebookings(target_date);
CREATE INDEX idx_vegetable_prebookings_category ON vegetable_prebookings(category);
CREATE INDEX idx_vegetable_prebookings_name ON vegetable_prebookings(vegetable_name);
CREATE INDEX idx_vegetable_prebookings_created_at ON vegetable_prebookings(created_at DESC);

-- =============================================================================
-- 4. VEGETABLE DEMAND ANALYTICS VIEW
-- =============================================================================
-- This view provides aggregated demand analytics for sellers and admin
CREATE OR REPLACE VIEW vegetable_demand_view AS
SELECT 
    -- Basic product info
    vr.vegetable_name,
    vr.category,
    
    -- Request statistics
    COUNT(DISTINCT vr.id) as total_requests,
    COUNT(DISTINCT vr.requested_by) as unique_requesters,
    
    -- Prebooking statistics  
    COALESCE(pb_stats.total_prebookings, 0) as total_prebookings,
    COALESCE(pb_stats.total_quantity_demanded, 0) as total_quantity_demanded,
    COALESCE(pb_stats.avg_estimated_price, 0) as avg_estimated_price,
    COALESCE(pb_stats.unique_customers, 0) as unique_customers,
    COALESCE(pb_stats.earliest_needed_date, NULL) as earliest_needed_date,
    COALESCE(pb_stats.latest_needed_date, NULL) as latest_needed_date,
    
    -- Demand level calculation
    CASE 
        WHEN COALESCE(pb_stats.total_prebookings, 0) >= 20 THEN 'high'
        WHEN COALESCE(pb_stats.total_prebookings, 0) >= 5 THEN 'medium'  
        WHEN COALESCE(pb_stats.total_prebookings, 0) >= 1 THEN 'low'
        ELSE 'none'
    END as demand_level,
    
    -- Seller-specific data
    pb_stats.seller_id,
    
    -- Timestamps
    MIN(vr.created_at) as first_request_date,
    MAX(vr.created_at) as latest_request_date
    
FROM vegetable_requests vr
LEFT JOIN (
    SELECT 
        vegetable_name,
        category,
        seller_id,
        COUNT(*) as total_prebookings,
        SUM(quantity) as total_quantity_demanded,
        AVG(estimated_price) as avg_estimated_price,
        COUNT(DISTINCT user_id) as unique_customers,
        MIN(target_date) as earliest_needed_date,
        MAX(target_date) as latest_needed_date
    FROM vegetable_prebookings 
    WHERE status NOT IN ('cancelled', 'rejected')
    GROUP BY vegetable_name, category, seller_id
) pb_stats ON vr.vegetable_name = pb_stats.vegetable_name 
           AND vr.category = pb_stats.category
WHERE vr.status = 'active'
GROUP BY vr.vegetable_name, vr.category, pb_stats.seller_id, 
         pb_stats.total_prebookings, pb_stats.total_quantity_demanded,
         pb_stats.avg_estimated_price, pb_stats.unique_customers,
         pb_stats.earliest_needed_date, pb_stats.latest_needed_date;

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE vegetable_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vegetable_prebookings ENABLE ROW LEVEL SECURITY;

-- Vegetable Requests Policies
CREATE POLICY "Users can view all vegetable requests" ON vegetable_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own requests" ON vegetable_requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update their own requests" ON vegetable_requests
    FOR UPDATE USING (auth.uid() = requested_by);

CREATE POLICY "Users can delete their own requests" ON vegetable_requests
    FOR DELETE USING (auth.uid() = requested_by);

-- Vegetable Prebookings Policies  
CREATE POLICY "Users can view their own prebookings" ON vegetable_prebookings
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create prebookings" ON vegetable_prebookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and sellers can update relevant prebookings" ON vegetable_prebookings
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = seller_id);

CREATE POLICY "Users can cancel their own prebookings" ON vegetable_prebookings
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 6. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_vegetable_requests_updated_at 
    BEFORE UPDATE ON vegetable_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vegetable_prebookings_updated_at 
    BEFORE UPDATE ON vegetable_prebookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. SAMPLE DATA FOR TESTING (Optional - uncomment to use)
-- =============================================================================

/*
-- Sample vegetable requests
INSERT INTO vegetable_requests (vegetable_name, category, description, target_season) VALUES
('Organic Tomatoes', 'Fruit', 'Looking for vine-ripened organic tomatoes', 'Summer'),
('Baby Spinach', 'Leafy', 'Fresh baby spinach for salads', 'Winter'),
('Purple Cabbage', 'Vegetable', 'Purple/red cabbage for coleslaw', 'Winter'),
('Fresh Basil', 'Herbs', 'Italian basil for cooking', 'Year-round'),
('Rainbow Carrots', 'Root', 'Multi-colored heritage carrots', 'Winter');

-- Note: Actual prebookings require real user IDs, so add those manually after users are created
*/

-- =============================================================================
-- 8. VERIFICATION QUERIES
-- =============================================================================

-- Verify tables were created
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('vegetable_requests', 'vegetable_prebookings')
ORDER BY table_name, ordinal_position;

-- Verify view was created
SELECT * FROM vegetable_demand_view LIMIT 5;

COMMENT ON TABLE vegetable_requests IS 'Stores customer requests for vegetables not currently available';
COMMENT ON TABLE vegetable_prebookings IS 'Stores advance orders/prebookings from customers to sellers';
COMMENT ON VIEW vegetable_demand_view IS 'Aggregated view of vegetable demand analytics for sellers and admin';

-- =============================================================================
-- END OF SCHEMA CREATION
-- =============================================================================
