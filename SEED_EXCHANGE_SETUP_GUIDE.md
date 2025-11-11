# Seed Exchange Network - Setup Guide

## 🚀 Quick Start

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `database/create-seed-exchange-system.sql`
4. Paste and click **Run**
5. Wait for success message

### Step 2: Verify Tables Created

Run this verification query in Supabase SQL Editor:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'seed_categories',
  'seeds',
  'seed_exchange_requests',
  'seed_reviews',
  'seed_wishlists'
);

-- Check seed categories data
SELECT * FROM seed_categories ORDER BY display_order;

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'seed%';
```

Expected results:
- ✅ 5 tables created
- ✅ 8 seed categories inserted
- ✅ RLS policies active

### Step 3: Test API Endpoints

After running migrations, test the API:

```bash
# Get seed categories
curl http://localhost:3000/api/seeds/categories

# Get all seeds (should be empty initially)
curl http://localhost:3000/api/seeds
```

### Step 4: Access Seed Marketplace

Navigate to: `http://localhost:3000/seeds`

## 📊 Database Schema Overview

### Tables Created

1. **seed_categories** - Categories like Vegetables, Fruits, Herbs
2. **seeds** - Main seed listings with growing info
3. **seed_exchange_requests** - Exchange/purchase requests
4. **seed_reviews** - User reviews and ratings
5. **seed_wishlists** - User wishlist for seeds they want

### Key Features

- ✅ Row Level Security (RLS) enabled
- ✅ Automatic timestamps
- ✅ Exchange count tracking
- ✅ Location-based filtering
- ✅ Heirloom variety tracking
- ✅ Growing information database

## 🔧 Troubleshooting

### Issue: Foreign key constraint errors

**Solution:** Make sure `users` table exists first. It should already exist in your database.

### Issue: RLS policies blocking access

**Solution:** Check if you're authenticated. Test with:
```sql
SELECT auth.uid(); -- Should return your user ID
```

### Issue: Duplicate seed categories

**Solution:** The migration uses `ON CONFLICT DO NOTHING` - safe to re-run.

## 🎯 Next Steps

1. ✅ Run database migration
2. ⏳ Create API endpoints
3. ⏳ Build UI components
4. ⏳ Test seed listing flow
5. ⏳ Test exchange request flow

## 📱 Features Ready

After setup, users can:
- 🌱 List their seeds for sharing/exchange
- 🔍 Browse seeds by category
- 💚 Create wishlist of wanted seeds
- 🤝 Request seeds (free/exchange/purchase)
- ⭐ Review seeds they've grown
- 📊 Track germination rates
- 📍 Find seeds from nearby members

## 🔐 Security

All tables have RLS policies:
- Users can only edit their own listings
- Exchange requests visible to involved parties only
- Reviews and categories are public
- Wishlists are private

Ready to proceed! 🚀

