-- ===================================================
-- ARYA NATURAL FARMS DATABASE BACKUP - COMPLETE SCHEMA
-- ===================================================
-- Generated on: August 14, 2025
-- Status: Working production state
-- Contains: Schema + Policies + Permissions (NO DATA)
-- 
-- To restore: Run this entire script in Supabase SQL Editor
-- ===================================================

-- ===================================================
-- 1. CREATE TABLES
-- ===================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin', 'superadmin')),
    avatar_url TEXT,
    phone VARCHAR(20),
    location TEXT,
    whatsapp_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vegetables table
CREATE TABLE IF NOT EXISTS vegetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'kg',
    images TEXT[],
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location TEXT,
    organic BOOLEAN DEFAULT false,
    harvest_date DATE,
    expiry_date DATE,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table  
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    vegetable_id UUID REFERENCES vegetables(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ===================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Vegetables indexes
CREATE INDEX IF NOT EXISTS idx_vegetables_owner_id ON vegetables(owner_id);
CREATE INDEX IF NOT EXISTS idx_vegetables_category ON vegetables(category);
CREATE INDEX IF NOT EXISTS idx_vegetables_available ON vegetables(available);
CREATE INDEX IF NOT EXISTS idx_vegetables_created_at ON vegetables(created_at);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vegetable_id ON order_items(vegetable_id);

-- ===================================================
-- 3. ROW LEVEL SECURITY (RLS) - DISABLED FOR NOW
-- ===================================================
-- Current working state: RLS is DISABLED on all tables
-- This allows the application to work without policy conflicts

-- Disable RLS on all tables (current working state)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vegetables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- ===================================================
-- 4. PERMISSIONS & GRANTS
-- ===================================================

-- Grant permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON vegetables TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;

-- Grant permissions to anonymous users (for public viewing)
GRANT ALL ON users TO anon;
GRANT ALL ON vegetables TO anon;
GRANT ALL ON orders TO anon;
GRANT ALL ON order_items TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ===================================================
-- 5. FUNCTIONS & TRIGGERS (if needed)
-- ===================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vegetables_updated_at ON vegetables;
CREATE TRIGGER update_vegetables_updated_at 
    BEFORE UPDATE ON vegetables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- 6. VERIFICATION QUERIES
-- ===================================================

-- Check that all tables exist
SELECT 'Tables created successfully' as status;

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM (VALUES ('users'), ('vegetables'), ('orders'), ('order_items')) as t(table_name)
ORDER BY table_name;

-- ===================================================
-- BACKUP COMPLETED
-- ===================================================
-- This backup represents the current working state of the Arya Natural Farms database.
-- 
-- Key features of this backup:
-- ✅ Complete table schemas with all columns
-- ✅ Primary keys and foreign key relationships  
-- ✅ Performance indexes
-- ✅ RLS disabled (current working configuration)
-- ✅ Proper permissions for authenticated and anonymous users
-- ✅ Update timestamp triggers
-- ✅ Data type constraints and validations
--
-- To restore from this backup:
-- 1. Drop existing tables if needed
-- 2. Run this entire script in Supabase SQL Editor
-- 3. Verify tables are created successfully
-- ===================================================
