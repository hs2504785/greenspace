-- Fix vegetables table INSERT policy
-- The current policy uses USING clause which doesn't work for INSERT operations
-- We need to use WITH CHECK for INSERT operations

-- Drop the existing policy
DROP POLICY IF EXISTS "Owners can manage vegetables" ON vegetables;

-- Create separate policies for better clarity and functionality
CREATE POLICY "Anyone can view vegetables" ON vegetables
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vegetables" ON vegetables
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update vegetables" ON vegetables
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete vegetables" ON vegetables
  FOR DELETE USING (auth.uid() = owner_id);
