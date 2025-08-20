-- Fix RLS policies for payment_transactions table
-- This addresses the "new row violates row-level security policy" error

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow payment transaction creation" ON payment_transactions;

-- Create a more permissive INSERT policy for payment transactions
-- Allow authenticated users to create payment transactions for their own orders
CREATE POLICY "Users can create payment transactions" ON payment_transactions
    FOR INSERT WITH CHECK (
        -- Allow if user owns the order
        (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())) OR
        -- Allow if it's a guest order (for guest checkout)
        (guest_order_id IS NOT NULL) OR
        -- Allow if user has admin/seller role
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'seller', 'superadmin'))
    );

-- Also ensure the service role can perform operations (for API endpoints)
-- This helps with server-side operations
GRANT ALL ON payment_transactions TO service_role;
GRANT ALL ON payment_methods TO service_role;

-- Grant usage on sequences if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
