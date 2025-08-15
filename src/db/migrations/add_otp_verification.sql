-- Create OTP verification table for mobile authentication
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);

-- Make email optional for mobile users
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add phone_number field to users table if not exists (making it optional for Google users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'google';

-- Add unique constraint on phone_number (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number_unique 
ON users(phone_number) 
WHERE phone_number IS NOT NULL;

-- Add constraint to ensure either email or phone_number is provided
ALTER TABLE users ADD CONSTRAINT email_or_phone_required 
CHECK (email IS NOT NULL OR phone_number IS NOT NULL);

-- Clean up expired OTP records (optional - can be run periodically)
-- DELETE FROM otp_verifications WHERE expires_at < NOW();
