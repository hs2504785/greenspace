-- ===================================================
-- PERFORMANCE INDEXES FOR PRODUCTION DATABASE
-- ===================================================
-- Supabase-compatible version (no \echo or \i commands)
-- Run this script to improve database query performance

-- Start with a status message
SELECT 'Starting performance index application...' as status;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_id_role ON users(id, role); -- Composite for role checks

-- Vegetables table indexes
CREATE INDEX IF NOT EXISTS idx_vegetables_owner_id ON vegetables(owner_id);
CREATE INDEX IF NOT EXISTS idx_vegetables_category ON vegetables(category);
CREATE INDEX IF NOT EXISTS idx_vegetables_location ON vegetables(location);
CREATE INDEX IF NOT EXISTS idx_vegetables_created_at ON vegetables(created_at);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vegetable_id ON order_items(vegetable_id);

-- Discussions table indexes (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'discussions') THEN
        CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
        CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category);
        CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);
        RAISE NOTICE 'Discussions indexes created successfully';
    ELSE
        RAISE NOTICE 'Discussions table does not exist, skipping indexes';
    END IF;
END $$;

-- Comments table indexes (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments') THEN
        CREATE INDEX IF NOT EXISTS idx_comments_discussion_id ON comments(discussion_id);
        CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
        CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
        RAISE NOTICE 'Comments indexes created successfully';
    ELSE
        RAISE NOTICE 'Comments table does not exist, skipping indexes';
    END IF;
END $$;

-- Seller requests table indexes (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'seller_requests') THEN
        CREATE INDEX IF NOT EXISTS idx_seller_requests_user_id ON seller_requests(user_id);
        CREATE INDEX IF NOT EXISTS idx_seller_requests_status ON seller_requests(status);
        CREATE INDEX IF NOT EXISTS idx_seller_requests_reviewed_by ON seller_requests(reviewed_by);
        CREATE INDEX IF NOT EXISTS idx_seller_requests_created_at ON seller_requests(created_at);
        
        -- Composite index for the main admin query
        CREATE INDEX IF NOT EXISTS idx_seller_requests_admin_query 
        ON seller_requests(status, created_at DESC, user_id, reviewed_by);
        
        RAISE NOTICE 'Seller requests indexes created successfully';
    ELSE
        RAISE NOTICE 'Seller requests table does not exist, skipping indexes';
    END IF;
END $$;

-- Tree management indexes (if tables exist)
DO $$ 
BEGIN
    -- Trees table indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trees') THEN
        CREATE INDEX IF NOT EXISTS idx_trees_code ON trees(code);
        CREATE INDEX IF NOT EXISTS idx_trees_farm_id ON trees(farm_id);
        CREATE INDEX IF NOT EXISTS idx_trees_category ON trees(category);
        CREATE INDEX IF NOT EXISTS idx_trees_season ON trees(season);
        CREATE INDEX IF NOT EXISTS idx_trees_mature_height ON trees(mature_height);
        RAISE NOTICE 'Trees indexes created successfully';
    END IF;
    
    -- Farm layouts indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'farm_layouts') THEN
        CREATE INDEX IF NOT EXISTS idx_farm_layouts_farm_id ON farm_layouts(farm_id);
        CREATE INDEX IF NOT EXISTS idx_farm_layouts_is_active ON farm_layouts(is_active);
        RAISE NOTICE 'Farm layouts indexes created successfully';
    END IF;
    
    -- Tree positions indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tree_positions') THEN
        CREATE INDEX IF NOT EXISTS idx_tree_positions_layout_id ON tree_positions(layout_id);
        CREATE INDEX IF NOT EXISTS idx_tree_positions_coordinates ON tree_positions(grid_x, grid_y);
        CREATE INDEX IF NOT EXISTS idx_tree_positions_status ON tree_positions(status);
        CREATE INDEX IF NOT EXISTS idx_tree_positions_variety ON tree_positions(variety);
        CREATE INDEX IF NOT EXISTS idx_tree_positions_planting_date ON tree_positions(planting_date);
        RAISE NOTICE 'Tree positions indexes created successfully';
    END IF;
    
    -- Tree care logs indexes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tree_care_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_tree_care_logs_tree_id ON tree_care_logs(tree_id);
        CREATE INDEX IF NOT EXISTS idx_tree_care_logs_performed_by ON tree_care_logs(performed_by);
        CREATE INDEX IF NOT EXISTS idx_tree_care_logs_performed_at ON tree_care_logs(performed_at);
        RAISE NOTICE 'Tree care logs indexes created successfully';
    END IF;
END $$;

-- Check created indexes and show summary
SELECT 'Performance indexes application completed!' as status;

-- Show all created indexes for verification
SELECT 
    'INDEX SUMMARY:' as summary,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN ('users', 'vegetables', 'orders', 'order_items', 'discussions', 'comments', 'seller_requests', 'trees', 'farm_layouts', 'tree_positions', 'tree_care_logs')
ORDER BY tablename, indexname;

SELECT 'All performance indexes have been applied successfully!' as final_status;
