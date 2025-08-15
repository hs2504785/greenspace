import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client only if environment variables are available
let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request) {
  try {
    // Check if Supabase is properly configured
    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase configuration is missing",
          details:
            "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Starting database migration...");

    // Step 1: Create OTP verifications table using direct SQL
    const { error: createTableError } = await supabase
      .from("otp_verifications")
      .select("id")
      .limit(1);

    // If table doesn't exist, we'll get an error, so we need to create it
    if (createTableError && createTableError.code === "PGRST116") {
      // Table doesn't exist, let's create it manually through a different approach
      console.log(
        "OTP verifications table does not exist, needs to be created manually"
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Please create the OTP verifications table manually through Supabase SQL Editor",
          instructions: `
            Go to your Supabase dashboard > SQL Editor and run this SQL:
            
            CREATE TABLE otp_verifications (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              phone_number VARCHAR(20) NOT NULL,
              otp_code VARCHAR(6) NOT NULL,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              verified BOOLEAN DEFAULT FALSE,
              attempts INTEGER DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
            );
            
            CREATE INDEX idx_otp_phone_number ON otp_verifications(phone_number);
            CREATE INDEX idx_otp_expires_at ON otp_verifications(expires_at);
            
            ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'google';
            
            CREATE UNIQUE INDEX idx_users_phone_number_unique 
            ON users(phone_number) 
            WHERE phone_number IS NOT NULL;
          `,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if phone_number column exists in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("phone_number")
      .limit(1);

    if (
      userError &&
      userError.message.includes('column "phone_number" does not exist')
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Users table needs to be updated. Please run the SQL commands in Supabase dashboard.",
          instructions: `
            Go to your Supabase dashboard > SQL Editor and run:
            
            ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
            ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
            ALTER TABLE users ADD COLUMN provider VARCHAR(50) DEFAULT 'google';
            
            CREATE UNIQUE INDEX idx_users_phone_number_unique 
            ON users(phone_number) 
            WHERE phone_number IS NOT NULL;
          `,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Database migration completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database is ready for mobile authentication",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to check database",
        error: error,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
