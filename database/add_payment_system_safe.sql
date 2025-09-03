-- Safe Payment System Migration
-- This version handles existing policies and tables gracefully

-- Add payment fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS upi_qr_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES users(id);

-- Add payment fields to guest_orders table
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'pending';
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS upi_qr_code TEXT;
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES users(id);

-- Create payment_transactions table for detailed transaction tracking
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    guest_order_id UUID REFERENCES guest_orders(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'razorpay', 'upi_qr', 'cash_on_delivery'
    payment_gateway VARCHAR(50), -- 'razorpay', 'manual', null
    gateway_transaction_id TEXT,
    gateway_payment_id TEXT,
    gateway_order_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, success, failed, refunded, manual_verification
    gateway_response JSONB, -- Store full gateway response
    failure_reason TEXT,
    screenshot_url TEXT, -- For UPI QR payments
    verified_by UUID REFERENCES users(id), -- Admin who verified the payment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure either order_id or guest_order_id is present, not both
    CONSTRAINT check_order_reference CHECK (
        (order_id IS NOT NULL AND guest_order_id IS NULL) OR 
        (order_id IS NULL AND guest_order_id IS NOT NULL)
    )
);

-- Create payment_methods table for seller UPI details
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL, -- 'upi', 'bank_account'
    is_active BOOLEAN DEFAULT true,
    upi_id VARCHAR(255),
    account_holder_name VARCHAR(255),
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    display_name VARCHAR(255), -- e.g., "Arya Natural Farms UPI"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_guest_order_id ON payment_transactions(guest_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_methods_seller_id ON payment_methods(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_guest_orders_payment_status ON guest_orders(payment_status);

-- Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Sellers can view payment transactions for their orders" ON payment_transactions;
DROP POLICY IF EXISTS "Allow payment transaction creation" ON payment_transactions;
DROP POLICY IF EXISTS "Users can create payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Sellers can update payment transactions" ON payment_transactions;

-- Create new policies for payment_transactions
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
    FOR SELECT USING (
        (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())) OR
        (guest_order_id IN (SELECT id FROM guest_orders WHERE true)) -- Guests can view via API with order ID
    );

CREATE POLICY "Sellers can view payment transactions for their orders" ON payment_transactions
    FOR SELECT USING (
        (order_id IN (SELECT id FROM orders WHERE seller_id = auth.uid())) OR
        (guest_order_id IN (SELECT id FROM guest_orders WHERE seller_id = auth.uid()))
    );

CREATE POLICY "Users can create payment transactions" ON payment_transactions
    FOR INSERT WITH CHECK (
        -- Allow if user owns the order
        (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())) OR
        -- Allow if it's a guest order (for guest checkout)
        (guest_order_id IS NOT NULL) OR
        -- Allow if user has admin/seller role
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'seller', 'superadmin'))
    );

CREATE POLICY "Sellers can update payment transactions" ON payment_transactions
    FOR UPDATE USING (
        (order_id IN (SELECT id FROM orders WHERE seller_id = auth.uid())) OR
        (guest_order_id IN (SELECT id FROM guest_orders WHERE seller_id = auth.uid())) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Enable RLS on payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for payment_methods if they exist
DROP POLICY IF EXISTS "Sellers can manage own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods;

-- Create policies for payment_methods
CREATE POLICY "Sellers can manage own payment methods" ON payment_methods
    FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Users can view payment methods" ON payment_methods
    FOR SELECT USING (is_active = true);

-- Update order status constraints to include payment statuses (drop first to avoid conflicts)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'payment_pending', 'payment_received', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'processing', 'success', 'failed', 'refunded', 'manual_verification'));

-- Update guest_orders status constraints
ALTER TABLE guest_orders DROP CONSTRAINT IF EXISTS guest_orders_status_check;
ALTER TABLE guest_orders ADD CONSTRAINT guest_orders_status_check 
    CHECK (status IN ('whatsapp_sent', 'payment_pending', 'payment_received', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE guest_orders DROP CONSTRAINT IF EXISTS guest_orders_payment_status_check;
ALTER TABLE guest_orders ADD CONSTRAINT guest_orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'processing', 'success', 'failed', 'refunded', 'manual_verification'));

-- Grant permissions to service role (for API operations)
GRANT ALL ON payment_transactions TO service_role;
GRANT ALL ON payment_methods TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Success message
SELECT 'Payment system migration completed successfully!' as result;
