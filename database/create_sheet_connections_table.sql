-- Create table to track user-sheet connections (not the products themselves)
CREATE TABLE IF NOT EXISTS user_sheet_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sheet_id VARCHAR(255) NOT NULL, -- Google Sheets spreadsheet ID
    sheet_url TEXT NOT NULL, -- Full Google Sheets URL
    user_email VARCHAR(255) NOT NULL, -- User's email for verification
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure one connection per user
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_sheet_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own connections
CREATE POLICY "Users can access own sheet connections" ON user_sheet_connections
    FOR ALL USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_sheet_connections_user_id ON user_sheet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sheet_connections_sheet_id ON user_sheet_connections(sheet_id);
