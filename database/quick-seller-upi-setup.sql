-- Quick Seller UPI Setup
-- Run this after applying the main payment migration

-- Replace these values with actual seller information:
-- 'YOUR_SELLER_USER_ID' - Get this from the users table
-- 'your-upi-id@paytm' - Your actual UPI ID
-- 'Your Farm Name' - Display name for the payment method

-- First, check your user ID (run this to find your seller ID):
SELECT id, name, email, role FROM users WHERE role = 'superadmin';

-- Then insert UPI payment method (replace the values below):
INSERT INTO payment_methods (
  seller_id,
  method_type, 
  upi_id,
  account_holder_name,
  display_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  '0e13a58b-a5e2-4ed3-9c69-9634c7413550',
  'upi',
  'smritisgh171@okicici', -- Replace with your actual UPI ID
  'Smriti Singh', -- Replace with account holder name
  'Smriti', -- Replace with display name
  true,
  NOW(),
  NOW()
);

-- Verify the setup:
SELECT 
  pm.display_name,
  pm.upi_id,
  pm.account_holder_name,
  u.name as seller_name
FROM payment_methods pm
JOIN users u ON pm.seller_id = u.id
WHERE pm.is_active = true;
