# Fix for Vegetable Creation Error

## Problem

Users are getting an error when trying to create vegetables: `Error creating vegetable: {}`. This is caused by incorrect Row Level Security (RLS) policies on the vegetables table.

## Root Cause

The current RLS policy for vegetables uses:

```sql
CREATE POLICY "Owners can manage vegetables" ON vegetables
  FOR ALL USING (auth.uid() = owner_id);
```

This doesn't work for INSERT operations because during INSERT, the row doesn't exist yet, so the `USING` clause fails.

## Solution

Apply the following SQL commands to your Supabase database:

### Step 1: Connect to your Supabase database

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following commands:

### Step 2: Fix the policies

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "Owners can manage vegetables" ON vegetables;

-- Recreate with proper INSERT policy
CREATE POLICY "Anyone can view vegetables" ON vegetables
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vegetables" ON vegetables
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update vegetables" ON vegetables
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete vegetables" ON vegetables
  FOR DELETE USING (auth.uid() = owner_id);
```

### Step 3: Verify the fix

After applying these changes, try creating a vegetable again. The error should be resolved.

## Technical Details

- INSERT operations need `WITH CHECK` clause instead of `USING` clause
- `USING` clause is for checking existing rows (SELECT, UPDATE, DELETE)
- `WITH CHECK` clause is for validating new/modified rows (INSERT, UPDATE)

## Files Changed

- `src/services/VegetableService.js` - Improved error logging
- `database/fix-vegetables-insert-issue.md` - This documentation
- `src/db/migrations/fix_vegetables_insert_policy.sql` - Migration script
