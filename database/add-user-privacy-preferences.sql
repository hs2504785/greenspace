-- Migration: Add User Privacy Preferences
-- Description: Adds privacy settings for users to control visibility of contact information

-- Add privacy preference columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_email_publicly BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_phone_publicly BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_whatsapp_publicly BOOLEAN DEFAULT false;

-- Add a general profile visibility setting
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true;

-- Add indexes for better performance when filtering by privacy settings
CREATE INDEX IF NOT EXISTS idx_users_show_email_publicly ON users(show_email_publicly) WHERE show_email_publicly = true;
CREATE INDEX IF NOT EXISTS idx_users_show_phone_publicly ON users(show_phone_publicly) WHERE show_phone_publicly = true; 
CREATE INDEX IF NOT EXISTS idx_users_show_whatsapp_publicly ON users(show_whatsapp_publicly) WHERE show_whatsapp_publicly = true;
CREATE INDEX IF NOT EXISTS idx_users_profile_public ON users(profile_public) WHERE profile_public = true;

-- Update RLS policies to respect privacy preferences for public access
-- The existing policies should still work, but we'll update the public users API to filter based on these preferences

-- Add comments for documentation
COMMENT ON COLUMN users.show_email_publicly IS 'Allow email to be shown in public user listings';
COMMENT ON COLUMN users.show_phone_publicly IS 'Allow phone number to be shown in public user listings';
COMMENT ON COLUMN users.show_whatsapp_publicly IS 'Allow WhatsApp number to be shown in public user listings';
COMMENT ON COLUMN users.profile_public IS 'Allow user profile to appear in public community listings';
