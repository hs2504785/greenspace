# Tree Table Migration Guide

## 🔄 **Database Schema Update Required**

We've updated the tree management system to use **type-based fields** instead of **instance-based fields**. This requires a database migration.

## 📋 **What's Changing:**

### ❌ **Removing Instance-Level Fields:**

- `scientific_name` - Not practical for farm management
- `planting_date` - Belongs to tree positions (when planted)
- `expected_harvest_date` - Calculated per planted instance
- `status` - Health status per specific planted tree

### ✅ **Adding Type-Level Fields:**

- `category` - Fruit type (citrus, stone, tropical, berry, nut, exotic)
- `season` - Harvest season (summer, winter, monsoon, year-round)
- `years_to_fruit` - Time until first harvest (1-20 years)
- `mature_height` - Expected size (small, medium, large)

## 🚀 **How to Apply Migration:**

### **Option 1: Via Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `src/db/migrations/update_tree_fields_to_type_based.sql`
4. Click **Run** to execute the migration

### **Option 2: Via Command Line (if using psql)**

```bash
# Connect to your database
psql "your-supabase-connection-string"

# Run the migration
\i src/db/migrations/update_tree_fields_to_type_based.sql
```

### **Option 3: Via Node.js Script**

```javascript
// Create a migration script if needed
const { supabase } = require("./src/lib/supabase");
const fs = require("fs");

const migrationSQL = fs.readFileSync(
  "src/db/migrations/update_tree_fields_to_type_based.sql",
  "utf8"
);
await supabase.rpc("exec_sql", { sql: migrationSQL });
```

## ⚠️ **Important Notes:**

1. **Backup First**: Always backup your database before running migrations
2. **Test Environment**: Run on a test/staging database first
3. **Data Loss**: This migration will remove the `scientific_name`, `planting_date`, `expected_harvest_date`, and `status` columns
4. **Existing Data**: The migration will automatically populate new fields for existing tree types

## 🔙 **Rollback (If Needed):**

If something goes wrong, you can rollback using:

```sql
-- Run this file to revert changes
\i src/db/migrations/rollback_tree_fields_update.sql
```

## ✅ **Verification:**

After running the migration, verify it worked:

```sql
-- Check new table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trees'
ORDER BY ordinal_position;

-- Check existing data with new fields
SELECT code, name, category, season, years_to_fruit, mature_height
FROM trees
LIMIT 10;
```

## 🎯 **Expected Result:**

The `trees` table should now have:

- ✅ `category` (VARCHAR(50))
- ✅ `season` (VARCHAR(50))
- ✅ `years_to_fruit` (INTEGER)
- ✅ `mature_height` (VARCHAR(50))
- ❌ No more `scientific_name`, `planting_date`, `expected_harvest_date`, `status`

All existing tree records should be automatically populated with appropriate values based on their tree codes.

## 🚜 **Next Steps:**

After successful migration:

1. Test the tree management interface at `/trees`
2. Try planting trees using the updated modal
3. Verify all CRUD operations work correctly
4. Check that existing planted tree positions are unaffected

The tree positions table (`tree_positions`) remains unchanged - it still tracks where individual trees are planted, when they were planted, and their specific status.

