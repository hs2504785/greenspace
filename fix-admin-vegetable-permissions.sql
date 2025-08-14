-- Fix RLS policies to allow admins/superadmins to create and manage vegetables

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Sellers can create vegetables" ON vegetables;
DROP POLICY IF EXISTS "Sellers can manage own vegetables" ON vegetables;

-- Create new policies that allow sellers, admins, and superadmins
-- Sellers, admins, and superadmins can create vegetables
CREATE POLICY "Sellers and admins can create vegetables" ON vegetables
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('seller'::user_role, 'admin'::user_role, 'superadmin'::user_role)
        )
    );

-- Sellers, admins, and superadmins can manage their own vegetables
-- Admins and superadmins can also manage any vegetables
CREATE POLICY "Sellers and admins can manage vegetables" ON vegetables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (
                -- Sellers can only manage their own vegetables
                (users.role = 'seller'::user_role AND owner_id::text = auth.uid()::text)
                OR
                -- Admins and superadmins can manage any vegetables
                (users.role IN ('admin'::user_role, 'superadmin'::user_role))
            )
        )
    );

-- Also update the orders policies to allow admins to create orders (for testing purposes)
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;

CREATE POLICY "Buyers and admins can create orders" ON orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('buyer'::user_role, 'admin'::user_role, 'superadmin'::user_role)
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin vegetable permissions updated successfully!';
    RAISE NOTICE '👑 Admins and superadmins can now create and manage vegetables';
    RAISE NOTICE '🛒 Admins and superadmins can also create orders';
END $$;
