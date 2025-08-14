-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create vegetables table if it doesn't exist
CREATE TABLE IF NOT EXISTS vegetables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL,
  images TEXT[],
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view vegetables" ON vegetables;
DROP POLICY IF EXISTS "Owners can manage vegetables" ON vegetables;
DROP POLICY IF EXISTS "Users can create vegetables" ON vegetables;
DROP POLICY IF EXISTS "Owners can delete vegetables" ON vegetables;

-- Temporarily disable RLS for testing
ALTER TABLE vegetables DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON vegetables TO authenticated;
GRANT SELECT ON vegetables TO anon;

-- For debugging: Show all policies
SELECT * FROM pg_policies WHERE tablename = 'vegetables';