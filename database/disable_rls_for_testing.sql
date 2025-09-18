-- ===================================================
-- DISABLE RLS FOR TESTING FARM VISITS
-- ===================================================
-- Temporarily disable RLS to test if that's causing 500 errors
-- WARNING: This removes security policies - use only for testing!
-- ===================================================

-- Disable RLS on farm visit tables
ALTER TABLE farm_visit_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE farm_visit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE farm_visit_reviews DISABLE ROW LEVEL SECURITY;

-- Also disable on seller_farm_profiles if needed
ALTER TABLE seller_farm_profiles DISABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON farm_visit_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON farm_visit_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON farm_visit_reviews TO authenticated;
GRANT SELECT, UPDATE ON seller_farm_profiles TO authenticated;
