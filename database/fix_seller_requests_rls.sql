-- Fix Seller Requests RLS Policies
-- This script ensures admins can properly view all seller requests

-- First, let's check if the table exists and has data
SELECT 'Checking seller_requests table...' as status;

-- Show current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'seller_requests';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own requests" ON seller_requests;
DROP POLICY IF EXISTS "Users can create requests" ON seller_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON seller_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON seller_requests;

-- Create comprehensive RLS policies
-- 1. Users can view their own requests
CREATE POLICY "Users can view own seller requests" ON seller_requests
    FOR SELECT 
    USING (user_id = auth.uid());

-- 2. Users can create their own requests
CREATE POLICY "Users can create seller requests" ON seller_requests
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- 3. Admins and superadmins can view ALL requests
CREATE POLICY "Admins can view all seller requests" ON seller_requests
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 4. Admins and superadmins can update ALL requests
CREATE POLICY "Admins can update seller requests" ON seller_requests
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 5. Service role can do everything (for API operations)
CREATE POLICY "Service role full access" ON seller_requests
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Grant explicit permissions to service role
GRANT ALL ON seller_requests TO service_role;
GRANT ALL ON seller_farm_profiles TO service_role;
GRANT ALL ON seller_verification_badges TO service_role;

-- Show the new policies
SELECT 'New RLS policies created:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'seller_requests';

-- Test query to see if we can access the data
SELECT 'Testing data access...' as status;
SELECT COUNT(*) as total_requests FROM seller_requests;

SELECT 'RLS policy fix completed!' as result;
