-- Create an enum type for user roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update users table to use the enum and set default role
-- First, drop any existing policies that depend on the role column
DROP POLICY IF EXISTS "Sellers can create vegetables" ON vegetables;
DROP POLICY IF EXISTS "Sellers can manage own vegetables" ON vegetables;
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Drop the existing default that contains 'user' which is not in our enum
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Then change the column type using a CASE statement to handle the 'user' value
-- Since role is currently VARCHAR, we need to handle string comparison
ALTER TABLE users 
    ALTER COLUMN role TYPE user_role USING 
        CASE role::text
            WHEN 'user' THEN 'buyer'::user_role
            WHEN 'buyer' THEN 'buyer'::user_role
            WHEN 'seller' THEN 'seller'::user_role
            WHEN 'admin' THEN 'admin'::user_role
            ELSE 'buyer'::user_role
        END;

-- Now set the new default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'buyer'::user_role;

-- Set all existing users to 'buyer' by default
UPDATE users SET role = 'buyer' WHERE role IS NULL;

-- Create RLS policies for different roles
ALTER TABLE vegetables ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (both old and new names)
DROP POLICY IF EXISTS "Anyone can view vegetables" ON vegetables;
DROP POLICY IF EXISTS "Sellers can manage vegetables" ON vegetables;
DROP POLICY IF EXISTS "Owners can manage vegetables" ON vegetables;
DROP POLICY IF EXISTS "Sellers can create vegetables" ON vegetables;
DROP POLICY IF EXISTS "Sellers can manage own vegetables" ON vegetables;

-- Create new policies
-- Anyone can view vegetables
CREATE POLICY "Anyone can view vegetables" ON vegetables
    FOR SELECT USING (true);

-- Only sellers can create vegetables
CREATE POLICY "Sellers can create vegetables" ON vegetables
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'seller'::user_role
        )
    );

-- Sellers can only update/delete their own vegetables
CREATE POLICY "Sellers can manage own vegetables" ON vegetables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'seller'::user_role
            AND owner_id::text = auth.uid()::text
        )
    );

-- Update orders policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (both old and new names)
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders; 
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can view own orders" ON orders;
DROP POLICY IF EXISTS "Sellers can view their sales" ON orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON orders;

-- Create new policies
-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders" ON orders
    FOR SELECT USING (
        user_id::text = auth.uid()::text
    );

-- Sellers can view orders where they are the seller
CREATE POLICY "Sellers can view their sales" ON orders
    FOR SELECT USING (
        seller_id::text = auth.uid()::text
    );

-- Only buyers can create orders
CREATE POLICY "Buyers can create orders" ON orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'buyer'::user_role
        )
    );

-- Sellers can update order status of their sales
CREATE POLICY "Sellers can update order status" ON orders
    FOR UPDATE USING (
        seller_id::text = auth.uid()::text
    )
    WITH CHECK (
        seller_id::text = auth.uid()::text
    );

-- Grant permissions
GRANT SELECT ON vegetables TO anon;
GRANT ALL ON vegetables TO authenticated;
GRANT SELECT ON orders TO authenticated;
GRANT INSERT ON orders TO authenticated;
GRANT UPDATE ON orders TO authenticated;
