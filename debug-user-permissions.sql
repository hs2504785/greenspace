-- Debug script to check user permissions and policies

-- Check current user authentication
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as current_user_email;

-- Check the user's role in the database
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE id = auth.uid();

-- Check all RLS policies on vegetables table
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
WHERE tablename = 'vegetables';

-- Check all RLS policies on orders table
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
WHERE tablename = 'orders';

-- Test if current user can see their own record
SELECT 'User can see own record: ' || CASE WHEN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()
) THEN 'YES' ELSE 'NO' END as test_result;
