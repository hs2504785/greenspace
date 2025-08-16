-- ===================================================
-- GREENSPACE MARKETPLACE - COMPLETE SCHEMA BACKUP
-- ===================================================
-- Generated on: December 20, 2024
-- Environment: Production Ready
-- Contains: Complete database schema (tables, columns, constraints)
-- Version: 1.0 - Phase 1 Production Launch
-- 
-- Purpose: Complete backup of all database tables and structure
-- for production deployment and disaster recovery
-- ===================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================
-- CORE TABLES
-- ===================================================

-- Users Table (Core user management and authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,  -- Made optional for mobile users
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'buyer', 'seller', 'admin', 'superadmin', 'consumer')),
    avatar_url TEXT,
    phone VARCHAR(20),
    phone_number VARCHAR(20),  -- Added for mobile authentication
    whatsapp_number VARCHAR(20),
    location TEXT,
    provider VARCHAR(50) DEFAULT 'google',  -- Authentication provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraint: Either email OR phone must be provided
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

-- Vegetables Table (Product catalog for marketplace)
CREATE TABLE IF NOT EXISTS vegetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    images TEXT[],  -- Array of image URLs
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    organic BOOLEAN DEFAULT false,
    harvest_date DATE,
    expiry_date DATE,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Orders Table (Customer orders from registered users)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT,
    contact_number VARCHAR(20),
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Order Items Table (Line items for orders)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    vegetable_id UUID REFERENCES vegetables(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ===================================================
-- GUEST ORDERS SYSTEM (WhatsApp Integration)
-- ===================================================

-- Guest Orders Table (Orders from anonymous users via WhatsApp)
CREATE TABLE IF NOT EXISTS guest_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_name VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    guest_email VARCHAR(255) NULL,
    guest_address TEXT NOT NULL,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    order_items JSONB NOT NULL, -- Store cart items as JSON
    status VARCHAR(50) DEFAULT 'whatsapp_sent' CHECK (status IN ('whatsapp_sent', 'confirmed', 'delivered', 'cancelled')),
    notes TEXT NULL, -- For seller notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================
-- MOBILE AUTHENTICATION SYSTEM
-- ===================================================

-- OTP Verifications Table (Mobile phone verification)
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ===================================================
-- COMMUNITY FEATURES
-- ===================================================

-- Discussions Table (Community discussions)
CREATE TABLE IF NOT EXISTS discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Comments Table (Comments on discussions)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ===================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number_unique ON users(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Vegetables table indexes
CREATE INDEX IF NOT EXISTS idx_vegetables_owner_id ON vegetables(owner_id);
CREATE INDEX IF NOT EXISTS idx_vegetables_category ON vegetables(category);
CREATE INDEX IF NOT EXISTS idx_vegetables_location ON vegetables(location);
CREATE INDEX IF NOT EXISTS idx_vegetables_available ON vegetables(available);
CREATE INDEX IF NOT EXISTS idx_vegetables_price ON vegetables(price);
CREATE INDEX IF NOT EXISTS idx_vegetables_created_at ON vegetables(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vegetables_category_available ON vegetables(category, available);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(seller_id, status);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vegetable_id ON order_items(vegetable_id);

-- Guest orders table indexes
CREATE INDEX IF NOT EXISTS idx_guest_orders_seller_id ON guest_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_guest_orders_created_at ON guest_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_orders_phone ON guest_orders(guest_phone);
CREATE INDEX IF NOT EXISTS idx_guest_orders_status ON guest_orders(status);

-- OTP verifications table indexes
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);

-- Discussions table indexes
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_discussion_id ON comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ===================================================
-- VERIFICATION QUERIES
-- ===================================================

-- Verify all tables are created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM (VALUES 
    ('users'), 
    ('vegetables'), 
    ('orders'), 
    ('order_items'),
    ('guest_orders'),
    ('otp_verifications'),
    ('discussions'),
    ('comments')
) as t(table_name)
ORDER BY table_name;

-- ===================================================
-- COMMENTS AND DOCUMENTATION
-- ===================================================

-- Add helpful comments for production documentation
COMMENT ON TABLE users IS 'Core user management with support for Google OAuth and mobile authentication';
COMMENT ON TABLE vegetables IS 'Product catalog for organic farming marketplace';
COMMENT ON TABLE orders IS 'Customer orders from registered users';
COMMENT ON TABLE order_items IS 'Line items for customer orders';
COMMENT ON TABLE guest_orders IS 'Orders from anonymous users via WhatsApp integration';
COMMENT ON TABLE otp_verifications IS 'Mobile phone verification system for authentication';
COMMENT ON TABLE discussions IS 'Community discussions and forum posts';
COMMENT ON TABLE comments IS 'Comments on community discussions';

-- Column-specific comments
COMMENT ON COLUMN users.role IS 'User role: user, buyer, seller, admin, superadmin, consumer';
COMMENT ON COLUMN users.provider IS 'Authentication provider: google, mobile, etc.';
COMMENT ON COLUMN vegetables.source_type IS 'Source of vegetables: farm, garden, etc.';
COMMENT ON COLUMN guest_orders.order_items IS 'JSON array of order items with id, name, quantity, price, total, unit';
COMMENT ON COLUMN guest_orders.status IS 'Order status: whatsapp_sent, confirmed, delivered, cancelled';

-- ===================================================
-- SCHEMA BACKUP COMPLETED SUCCESSFULLY
-- ===================================================
-- This backup contains:
-- ✅ All core tables (users, vegetables, orders, order_items)
-- ✅ Guest orders system for WhatsApp integration
-- ✅ Mobile authentication system (OTP)
-- ✅ Community features (discussions, comments)
-- ✅ Complete indexes for performance optimization
-- ✅ All constraints and relationships
-- ✅ Documentation and comments
-- 
-- Next: Run policies backup and permissions backup
-- ===================================================
