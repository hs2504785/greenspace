-- =============================================================================
-- ADD PREBOOKING PRODUCT TYPE SUPPORT
-- =============================================================================
-- This script adds support for prebooking-only products in the vegetables table
-- =============================================================================

-- Add product_type column to vegetables table
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'regular' 
CHECK (product_type IN ('regular', 'prebooking'));

-- Add estimated availability date for prebooking products
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS estimated_available_date DATE;

-- Add harvest season for prebooking products
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS harvest_season TEXT 
CHECK (harvest_season IN ('Spring', 'Summer', 'Monsoon', 'Winter', 'Year-round'));

-- Add minimum order quantity for prebooking
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS min_order_quantity DECIMAL(10,2) DEFAULT 1;

-- Add advance payment requirement
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS advance_payment_required BOOLEAN DEFAULT false;

-- Add advance payment percentage (0-100)
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS advance_payment_percentage INTEGER DEFAULT 0 
CHECK (advance_payment_percentage BETWEEN 0 AND 100);

-- Add seller confidence level for prebooking items
-- Default 100% for existing products (they're already available, so high confidence)
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS seller_confidence INTEGER DEFAULT 100 
CHECK (seller_confidence BETWEEN 1 AND 100);

-- Add notes for prebooking products
ALTER TABLE vegetables 
ADD COLUMN IF NOT EXISTS prebooking_notes TEXT;

-- Create index for product_type
CREATE INDEX IF NOT EXISTS idx_vegetables_product_type ON vegetables(product_type);

-- Create index for estimated_available_date
CREATE INDEX IF NOT EXISTS idx_vegetables_estimated_date ON vegetables(estimated_available_date);

-- Create index for harvest_season
CREATE INDEX IF NOT EXISTS idx_vegetables_harvest_season ON vegetables(harvest_season);

-- =============================================================================
-- Update RLS policies to handle prebooking products
-- =============================================================================

-- Update existing policies (they should work with the new product_type)
-- No changes needed as the existing policies are based on user ownership

-- =============================================================================
-- Create view for prebooking products with demand analytics
-- =============================================================================

CREATE OR REPLACE VIEW prebooking_products_with_demand AS
SELECT 
    v.*,
    COALESCE(demand.total_requests, 0) as demand_requests,
    COALESCE(demand.total_prebookings, 0) as total_prebookings,
    COALESCE(demand.total_quantity_demanded, 0) as total_quantity_demanded,
    COALESCE(demand.unique_customers, 0) as interested_customers,
    CASE 
        WHEN COALESCE(demand.total_prebookings, 0) >= 20 THEN 'high'
        WHEN COALESCE(demand.total_prebookings, 0) >= 5 THEN 'medium'  
        WHEN COALESCE(demand.total_prebookings, 0) >= 1 THEN 'low'
        ELSE 'none'
    END as demand_level
FROM vegetables v
LEFT JOIN (
    SELECT 
        vr.vegetable_name,
        vr.category,
        COUNT(DISTINCT vr.id) as total_requests,
        COALESCE(pb_stats.total_prebookings, 0) as total_prebookings,
        COALESCE(pb_stats.total_quantity_demanded, 0) as total_quantity_demanded,
        COALESCE(pb_stats.unique_customers, 0) as unique_customers
    FROM vegetable_requests vr
    LEFT JOIN (
        SELECT 
            vegetable_name,
            category,
            COUNT(*) as total_prebookings,
            SUM(quantity) as total_quantity_demanded,
            COUNT(DISTINCT user_id) as unique_customers
        FROM vegetable_prebookings 
        WHERE status NOT IN ('cancelled', 'rejected')
        GROUP BY vegetable_name, category
    ) pb_stats ON vr.vegetable_name = pb_stats.vegetable_name 
               AND vr.category = pb_stats.category
    WHERE vr.status = 'active'
    GROUP BY vr.vegetable_name, vr.category, 
             pb_stats.total_prebookings, pb_stats.total_quantity_demanded, pb_stats.unique_customers
) demand ON v.name = demand.vegetable_name AND v.category = demand.category
WHERE v.product_type = 'prebooking';

-- =============================================================================
-- Sample data for testing
-- =============================================================================

-- Example: Insert some prebooking products
-- (Uncomment to add sample data)

/*
INSERT INTO vegetables (
    name, 
    category, 
    price, 
    quantity, 
    unit,
    location, 
    description,
    owner_id,
    product_type,
    estimated_available_date,
    harvest_season,
    min_order_quantity,
    seller_confidence,
    prebooking_notes
) VALUES 
(
    'Organic Winter Tomatoes',
    'Fruit', 
    50.00,
    0, -- No current stock for prebooking items
    'kg',
    'Pune', 
    'Premium organic tomatoes available for winter harvest prebooking',
    'your-user-id-here',
    'prebooking',
    '2024-12-15',
    'Winter',
    5.0,
    90,
    'These will be vine-ripened organic tomatoes. Minimum 5kg order. 25% advance payment required.'
),
(
    'Purple Cabbage (Spring Harvest)',
    'Vegetable', 
    35.00,
    0,
    'kg',
    'Mumbai', 
    'Beautiful purple cabbage for spring season',
    'your-user-id-here',
    'prebooking',
    '2024-03-20',
    'Spring',
    3.0,
    85,
    'Fresh purple cabbage perfect for salads and coleslaw. Available in March.'
);
*/

-- =============================================================================
-- Verification queries
-- =============================================================================

-- Check the new columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'vegetables' 
AND column_name IN ('product_type', 'estimated_available_date', 'harvest_season', 'min_order_quantity');

-- Check the view was created
SELECT * FROM prebooking_products_with_demand LIMIT 5;

COMMENT ON COLUMN vegetables.product_type IS 'Type of product: regular (in-stock) or prebooking (advance order)';
COMMENT ON COLUMN vegetables.estimated_available_date IS 'When prebooking products will be ready for harvest/delivery';
COMMENT ON COLUMN vegetables.harvest_season IS 'Season when prebooking products will be harvested';
COMMENT ON VIEW prebooking_products_with_demand IS 'Prebooking products with aggregated demand analytics';

-- =============================================================================
-- END OF SCHEMA UPDATE
-- =============================================================================
