-- Performance Indexes for Arya Natural Farms Database
-- These indexes will significantly improve query performance

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

-- Discussions table indexes
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_discussion_id ON comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

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
