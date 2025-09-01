-- Migration: Add WhatsApp Store Link to Users
-- Description: Adds WhatsApp store link field for users to link their external product catalogs

-- Add WhatsApp store link column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_store_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.whatsapp_store_link IS 'Link to user WhatsApp Business catalog or external store';

-- Add validation constraint to ensure it's a valid URL if provided
ALTER TABLE users ADD CONSTRAINT whatsapp_store_link_format 
CHECK (
  whatsapp_store_link IS NULL OR 
  whatsapp_store_link ~ '^https?://.*' OR
  whatsapp_store_link ~ '^wa\.me/.*' OR
  whatsapp_store_link ~ '^whatsapp://.*'
);
