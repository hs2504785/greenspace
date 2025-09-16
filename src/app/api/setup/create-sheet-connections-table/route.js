import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";

/**
 * Create the user_sheet_connections table
 * POST /api/setup/create-sheet-connections-table
 */
export async function POST(request) {
  try {
    const supabase = createSupabaseClient();

    // Try to create a simple test record to see if table exists
    const { data: testData, error: testError } = await supabase
      .from("user_sheet_connections")
      .select("id")
      .limit(1);

    if (testError && testError.code === '42P01') {
      // Table doesn't exist - return instructions
      return NextResponse.json({
        success: false,
        message: "Table does not exist. Please run the SQL manually in Supabase.",
        sql: `
-- Create table to track user-sheet connections (not the products themselves)
CREATE TABLE IF NOT EXISTS user_sheet_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sheet_id VARCHAR(255) NOT NULL,
    sheet_url TEXT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_sheet_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own connections  
CREATE POLICY "Users can access own sheet connections" ON user_sheet_connections
    FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sheet_connections_user_id ON user_sheet_connections(user_id);
        `
      }, { status: 400 });
    }

    if (error) {
      console.error("Error creating table:", error);
      return NextResponse.json(
        { error: "Failed to create table", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "user_sheet_connections table created successfully",
    });
  } catch (error) {
    console.error("Error in table creation:", error);
    return NextResponse.json(
      { error: "Failed to create table", details: error.message },
      { status: 500 }
    );
  }
}
