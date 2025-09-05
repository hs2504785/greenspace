-- Create user wishlist table for AI chat features
CREATE TABLE IF NOT EXISTS user_wishlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    max_price DECIMAL(10,2),
    preferred_location TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, fulfilled, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Prevent duplicate wishlist items for same user
    UNIQUE(user_id, item_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_wishlist_user_id ON user_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_item_name ON user_wishlist(item_name);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_status ON user_wishlist(status);

-- Enable RLS
ALTER TABLE user_wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wishlist" ON user_wishlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items" ON user_wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items" ON user_wishlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON user_wishlist
    FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_wishlist_updated_at 
    BEFORE UPDATE ON user_wishlist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
