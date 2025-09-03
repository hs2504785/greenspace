# 💳 Payment & Seller System Setup Guide

## 🚨 Issues: Payment Verification & Seller Registration Not Working

If you're seeing errors like:

- "Failed to fetch pending payment verifications"
- "Internal Server Error" on `/become-seller` page

It means the database tables haven't been set up yet.

## 🔧 Quick Fix

### Step 1: Run Payment System Migration

1. **Go to your Supabase Dashboard**

   - Visit [supabase.com](https://supabase.com)
   - Navigate to your project
   - Open **SQL Editor**

2. **Run the Safe Payment System Migration**

   - Copy the entire contents of `database/add_payment_system_safe.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Run the Seller System Migration**

   - Copy the entire contents of `database/setup_seller_system_safe.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

   **Note**: Both migrations handle existing tables and policies gracefully.

### Step 2: Verify Setup

After running the migration, the payment verification page should work properly.

## 📋 What Gets Created

The migration creates these tables:

- ✅ `payment_transactions` - Tracks all payment attempts and verifications
- ✅ `payment_methods` - Stores seller UPI/bank details
- ✅ Adds payment fields to `orders` and `guest_orders` tables
- ✅ Sets up proper indexes for performance
- ✅ Configures Row Level Security policies

## 🎯 Features Enabled

Once set up, you'll have:

- **Payment Verification Dashboard** - `/payment-verification`
- **UPI QR Code Generation** - Dynamic QR codes for each order
- **Screenshot Upload** - Customers can upload payment proofs
- **Admin Approval Workflow** - Sellers/admins can approve/reject payments
- **Order Status Updates** - Automatic order confirmation after payment approval

## 🔍 Troubleshooting

### Still Getting Errors?

1. **Policy Already Exists Error** - If you see "policy already exists":

   ```
   ERROR: 42710: policy "Users can view own payment transactions" for table "payment_transactions" already exists
   ```

   **Solution**: Use `database/add_payment_system_safe.sql` instead - it drops existing policies first.

2. **Check Browser Console** - Look for detailed error messages

3. **Verify Tables Exist** - Run this in Supabase SQL Editor:

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('payment_transactions', 'payment_methods');
   ```

4. **Check RLS Policies** - If you see permission errors:

   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'payment_transactions';
   ```

5. **Clean Slate Migration** - If tables are partially created:
   ```sql
   -- Only if you want to start fresh (WARNING: This deletes data!)
   DROP TABLE IF EXISTS payment_transactions CASCADE;
   DROP TABLE IF EXISTS payment_methods CASCADE;
   -- Then run add_payment_system_safe.sql
   ```

### Need Help?

- Check the browser console for detailed error messages
- The system will now gracefully handle missing tables
- Contact the development team if issues persist

## 🚀 Next Steps

After setup:

1. **Add UPI Payment Methods** - Sellers can add their UPI details
2. **Test Payment Flow** - Create a test order and verify the payment process
3. **Configure Notifications** - Set up payment confirmation emails/SMS

---

_This setup is required only once per database. After migration, the payment system will work for all users._
