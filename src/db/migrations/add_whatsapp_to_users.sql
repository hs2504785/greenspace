-- Add whatsapp_number column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Update RLS policies to allow users to update their own whatsapp_number
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);