-- Migration: Add guest_orders table for anonymous WhatsApp orders
-- This table stores orders placed by guests via WhatsApp for seller reference

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS guest_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_name VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    guest_email VARCHAR(255) NULL,
    guest_address TEXT NOT NULL,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    order_items JSONB NOT NULL, -- Store cart items as JSON
    status VARCHAR(50) DEFAULT 'whatsapp_sent' CHECK (status IN ('whatsapp_sent', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes TEXT NULL, -- For seller notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_orders_seller_id ON guest_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_guest_orders_created_at ON guest_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_orders_phone ON guest_orders(guest_phone);
CREATE INDEX IF NOT EXISTS idx_guest_orders_status ON guest_orders(status);

-- Add RLS policies
ALTER TABLE guest_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Sellers can view their own guest orders
CREATE POLICY "Sellers can view own guest orders" ON guest_orders
    FOR SELECT USING (seller_id = auth.uid());

-- Policy: Sellers can update their own guest orders (status, notes)
CREATE POLICY "Sellers can update own guest orders" ON guest_orders
    FOR UPDATE USING (seller_id = auth.uid());

-- Policy: Allow anonymous users to insert guest orders (needed for WhatsApp orders)
CREATE POLICY "Allow guest order creation" ON guest_orders
    FOR INSERT WITH CHECK (true);

-- Policy: Allow service role full access (for API operations)
CREATE POLICY "Service role full access" ON guest_orders
    FOR ALL USING (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON guest_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON guest_orders TO anon;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guest_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_guest_orders_updated_at ON guest_orders;
CREATE TRIGGER trigger_update_guest_orders_updated_at
    BEFORE UPDATE ON guest_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_guest_orders_updated_at();

-- Insert some helpful comments
COMMENT ON TABLE guest_orders IS 'Stores orders placed by anonymous users via WhatsApp';
COMMENT ON COLUMN guest_orders.order_items IS 'JSON array of order items with id, name, quantity, price, total, unit';
COMMENT ON COLUMN guest_orders.status IS 'Order status: whatsapp_sent, confirmed, processing, shipped, delivered, cancelled';
COMMENT ON COLUMN guest_orders.notes IS 'Seller notes about the order';
