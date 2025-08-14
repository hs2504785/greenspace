-- Part 2: Admin roles setup
-- Note: This script assumes that 'superadmin' has been added to the user_role enum
-- If you get an error about 'superadmin' not existing, run update-admin-roles-part1.sql first

-- Verify that superadmin exists in the enum before proceeding
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'superadmin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        RAISE EXCEPTION 'superadmin value does not exist in user_role enum. Please run update-admin-roles-part1.sql first and commit the transaction.';
    END IF;
END $$;

-- Add the role column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN role user_role DEFAULT 'buyer';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update existing users to have the buyer role if they don't have one
UPDATE users SET role = 'buyer'::user_role WHERE role IS NULL;

-- Set aryanaturalfarms@gmail.com as superadmin
UPDATE users 
SET role = 'superadmin'::user_role 
WHERE email = 'aryanaturalfarms@gmail.com';

-- Set hemant.ajax@gmail.com as buyer
UPDATE users 
SET role = 'buyer'::user_role 
WHERE email = 'hemant.ajax@gmail.com';

-- Create seller_requests table to manage seller applications
CREATE TABLE IF NOT EXISTS seller_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_description TEXT,
    location TEXT,
    contact_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    documents TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT
);

-- Enable RLS on seller_requests
ALTER TABLE seller_requests ENABLE ROW LEVEL SECURITY;

-- Policies for seller_requests
CREATE POLICY "Users can view their own requests" ON seller_requests
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create requests" ON seller_requests
    FOR INSERT WITH CHECK (
        user_id::text = auth.uid()::text AND
        status = 'pending'
    );

CREATE POLICY "Admins can view all requests" ON seller_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin'::user_role, 'superadmin'::user_role)
        )
    );

-- Update users table policies
CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin'::user_role, 'superadmin'::user_role)
        )
    );

-- Grant permissions
GRANT ALL ON seller_requests TO authenticated;
GRANT SELECT ON seller_requests TO anon;
