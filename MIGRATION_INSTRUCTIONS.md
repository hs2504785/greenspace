# 🔧 Database Migration Required

**The tree editing feature requires additional database columns.** Please follow these steps to add the required fields:

## 🎯 **Quick Fix (Recommended)**

### **Step 1: Open Supabase SQL Editor**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **"SQL Editor"** in the sidebar
4. Click **"New query"**

### **Step 2: Run This Migration SQL**

Copy and paste this entire SQL code into the editor and click **"Run"**:

```sql
-- Add missing fields to tree_positions table for individual tree instance data
-- This migration adds fields that should be specific to each planted tree instance

BEGIN;

-- Add variety field for specific tree varieties (e.g., Alphonso mango, Granny Smith apple)
ALTER TABLE tree_positions
  ADD COLUMN IF NOT EXISTS variety VARCHAR(255);

-- Add status field for health/growth status of this specific tree
ALTER TABLE tree_positions
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'healthy';

-- Add planting_date for when this specific tree was planted
ALTER TABLE tree_positions
  ADD COLUMN IF NOT EXISTS planting_date DATE;

-- Add notes field for tree-specific notes
ALTER TABLE tree_positions
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add updated_at timestamp for tracking changes
ALTER TABLE tree_positions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tree_positions_status ON tree_positions(status);
CREATE INDEX IF NOT EXISTS idx_tree_positions_variety ON tree_positions(variety);
CREATE INDEX IF NOT EXISTS idx_tree_positions_planting_date ON tree_positions(planting_date);

-- Update existing records to have default values
UPDATE tree_positions
SET
  status = 'healthy',
  planting_date = planted_at::date,
  updated_at = planted_at
WHERE status IS NULL OR planting_date IS NULL;

COMMIT;
```

### **Step 3: Verify Migration**

After running the migration, you should see:

- ✅ **Success message** in the SQL editor
- ✅ **Tree editing should work** without errors

## ⚠️ **Alternative: Manual Column Addition**

If the above doesn't work, you can add columns individually:

### **Method 1: Via Supabase Table Editor**

1. Go to **"Table Editor"** → **"tree_positions"**
2. Click **"Add Column"** for each:
   - `variety` (text)
   - `status` (text, default: 'healthy')
   - `planting_date` (date)
   - `notes` (text)
   - `updated_at` (timestamptz)

### **Method 2: Individual SQL Commands**

Run these one by one in SQL Editor:

```sql
ALTER TABLE tree_positions ADD COLUMN variety VARCHAR(255);
ALTER TABLE tree_positions ADD COLUMN status VARCHAR(50) DEFAULT 'healthy';
ALTER TABLE tree_positions ADD COLUMN planting_date DATE;
ALTER TABLE tree_positions ADD COLUMN notes TEXT;
ALTER TABLE tree_positions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
```

## 🔍 **What These Fields Do:**

| **Field**       | **Purpose**                    | **Example**                       |
| --------------- | ------------------------------ | --------------------------------- |
| `variety`       | Specific cultivar of this tree | "Alphonso", "Kesar"               |
| `status`        | Health/growth status           | "healthy", "diseased", "fruiting" |
| `planting_date` | When this tree was planted     | "2024-01-15"                      |
| `notes`         | Personal notes about this tree | "Needs more water", "Good growth" |
| `updated_at`    | When info was last updated     | Auto-timestamp                    |

## 🎯 **After Migration:**

- ✅ Tree editing modal will work perfectly
- ✅ You can set variety, status, and planting dates
- ✅ Add personal notes for each tree
- ✅ Track when information was last updated

---

**Need help?** The error you saw means the database columns don't exist yet. Running this migration will fix it! 🌳✨
