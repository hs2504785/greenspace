-- ===================================================
-- USER WISHLIST SYSTEM FOR AI CHAT
-- ===================================================
-- Purpose: Allow users to create wishlists through AI chat
-- Features: Item tracking, price alerts, availability notifications
-- ===================================================

-- Create user_wishlist table
CREATE TABLE IF NOT EXISTS user_wishlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Wishlist Item Details
    item_name VARCHAR(255) NOT NULL,
    max_price DECIMAL(10,2), -- Maximum price user is willing to pay
    preferred_location TEXT, -- Preferred seller location
    notes TEXT, -- Additional notes from user
    
    -- Alert Settings
    alert_enabled BOOLEAN DEFAULT true,
    last_alert_sent TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraints
    UNIQUE(user_id, item_name) -- Prevent duplicate items per user
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_wishlist_user_id ON user_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_item_name ON user_wishlist(item_name);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_alert_enabled ON user_wishlist(alert_enabled);

-- Enable RLS (Row Level Security)
ALTER TABLE user_wishlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own wishlist" ON user_wishlist;
DROP POLICY IF EXISTS "Users can insert their own wishlist items" ON user_wishlist;
DROP POLICY IF EXISTS "Users can update their own wishlist items" ON user_wishlist;
DROP POLICY IF EXISTS "Users can delete their own wishlist items" ON user_wishlist;

CREATE POLICY "Users can view their own wishlist" ON user_wishlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items" ON user_wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items" ON user_wishlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON user_wishlist
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at (drop existing first)
DROP TRIGGER IF EXISTS trigger_user_wishlist_updated_at ON user_wishlist;
CREATE TRIGGER trigger_user_wishlist_updated_at
    BEFORE UPDATE ON user_wishlist
    FOR EACH ROW
    EXECUTE FUNCTION update_user_wishlist_updated_at();

-- Grant necessary permissions
GRANT ALL ON user_wishlist TO authenticated;

-- Add some sample data for testing (optional)
-- INSERT INTO user_wishlist (user_id, item_name, max_price, preferred_location, notes)
-- SELECT 
--     id as user_id,
--     'Organic Tomatoes' as item_name,
--     50.00 as max_price,
--     'Delhi' as preferred_location,
--     'Looking for pesticide-free tomatoes' as notes
-- FROM users 
-- WHERE role = 'consumer' 
-- LIMIT 1;

COMMIT;
