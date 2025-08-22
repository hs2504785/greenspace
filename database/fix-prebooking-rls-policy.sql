-- =============================================================================
-- FIX PREBOOKING RLS POLICY
-- =============================================================================
-- This fixes the RLS policy issue preventing vegetable/prebooking creation
-- =============================================================================

-- Check current user roles first
SELECT id, email, name, role FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid());

-- Option 1: UPDATE USER ROLE TO SELLER (if needed)
-- Replace 'user@example.com' with the actual email trying to create prebooking
-- UPDATE users SET role = 'seller' WHERE email = 'user@example.com';

-- Option 2: MODIFY RLS POLICY TO ALLOW AUTHENTICATED USERS (Recommended)
-- Drop the restrictive seller-only policy
DROP POLICY IF EXISTS "Sellers can create vegetables" ON vegetables;

-- Create a more permissive policy for authenticated users
CREATE POLICY "Authenticated users can create vegetables" ON vegetables
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Option 3: ALLOW BOTH BUYERS AND SELLERS (Alternative approach)
-- DROP POLICY IF EXISTS "Sellers can create vegetables" ON vegetables;
-- CREATE POLICY "Buyers and sellers can create vegetables" ON vegetables
--     FOR INSERT WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM users
--             WHERE users.id = auth.uid()
--             AND users.role IN ('buyer'::user_role, 'seller'::user_role)
--         )
--     );

-- Verify the fix
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'vegetables'
ORDER BY policyname;

-- Test query (replace with actual user ID)
-- SELECT auth.uid(), 
--        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) as user_exists,
--        (SELECT role FROM users WHERE id = auth.uid()) as user_role;

-- =============================================================================
-- END OF FIX
-- =============================================================================
