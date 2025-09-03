# 🥬 Vegetables Table Production Deployment Guide

## Overview

This guide helps you safely deploy your local vegetables table schema changes to your production Supabase database. The process ensures data integrity while adding new fields and relationships.

---

## 🎯 What This Guide Covers

✅ **Schema Migration** - Update production vegetables table with local changes  
✅ **Data Safety** - Automatic backup before any changes  
✅ **Verification** - Pre and post-migration checks  
✅ **Rollback Plan** - Recovery process if issues occur

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Access to your Supabase production dashboard
- [ ] Admin/Owner permissions on the database
- [ ] Current local schema changes tested
- [ ] Production database backup (automated by our script)

---

## 🚀 Deployment Steps

### **Step 1: Pre-Migration Verification**

1. **Login to Supabase Dashboard**

   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your production project
   - Navigate to SQL Editor

2. **Run Pre-Migration Check**

   ```sql
   -- Copy and paste the entire contents of:
   -- database/verify-production-vegetables-schema.sql
   ```

   **Expected Results:**

   - Table exists ✅
   - Basic columns present ✅
   - Record current structure for comparison

---

### **Step 2: Execute Migration**

**⚠️ IMPORTANT:** This step will modify your production database. Ensure you're ready to proceed.

1. **Run Migration Script**

   ```sql
   -- Copy and paste the entire contents of:
   -- database/migrate-vegetables-to-production.sql
   ```

2. **Monitor Progress**
   The script will show progress messages:
   ```
   NOTICE: Added unit column to vegetables table
   NOTICE: Added organic column to vegetables table
   NOTICE: Added harvest_date column to vegetables table
   NOTICE: Added expiry_date column to vegetables table
   NOTICE: Added available column to vegetables table
   NOTICE: ================================
   NOTICE: VEGETABLES TABLE MIGRATION COMPLETE!
   ```

---

### **Step 3: Post-Migration Verification**

1. **Run Verification Again**

   ```sql
   -- Run the same verification script as Step 1:
   -- database/verify-production-vegetables-schema.sql
   ```

2. **Expected Results After Migration**
   - ✅ Table has 14+ columns (was ~11 before)
   - ✅ All required columns present
   - ✅ Correct data types
   - ✅ Indexes created
   - ✅ RLS policies updated

---

### **Step 4: Test Your Application**

1. **Frontend Testing**

   - Test vegetable creation forms
   - Verify vegetable listing pages
   - Check search and filter functionality

2. **API Testing**

   - Test `/api/vegetables` endpoints
   - Verify CRUD operations work
   - Check mobile app compatibility

3. **Database Queries**

   ```sql
   -- Test basic queries work
   SELECT id, name, price, unit, organic, available
   FROM vegetables
   LIMIT 5;

   -- Test new columns have expected defaults
   SELECT
     COUNT(*) as total_vegetables,
     COUNT(CASE WHEN unit = 'kg' THEN 1 END) as kg_unit,
     COUNT(CASE WHEN available = true THEN 1 END) as available_items,
     COUNT(CASE WHEN organic = false THEN 1 END) as non_organic
   FROM vegetables;
   ```

---

## 📊 Schema Changes Summary

| Field          | Before     | After          | Default Value |
| -------------- | ---------- | -------------- | ------------- |
| `unit`         | ❌ Missing | ✅ VARCHAR(20) | 'kg'          |
| `organic`      | ❌ Missing | ✅ BOOLEAN     | false         |
| `harvest_date` | ❌ Missing | ✅ DATE        | NULL          |
| `expiry_date`  | ❌ Missing | ✅ DATE        | NULL          |
| `available`    | ❌ Missing | ✅ BOOLEAN     | true          |

**Total Columns:** 11 → 14+

---

## 🛡️ Safety Features

### **Automatic Backup**

- Creates `vegetables_backup_YYYYMMDD` table before changes
- Contains complete copy of original data
- Can be used for rollback if needed

### **Safe Column Addition**

- Checks if columns exist before adding
- Sets sensible defaults for existing data
- No data loss or corruption

### **Index Management**

- Updates performance indexes
- Maintains query speed
- Optimizes new column searches

---

## 🚨 Emergency Rollback

If something goes wrong, you can rollback using the backup:

```sql
-- 1. Backup current state (if needed)
CREATE TABLE vegetables_after_migration AS SELECT * FROM vegetables;

-- 2. Drop current table
DROP TABLE vegetables;

-- 3. Restore from backup (replace YYYYMMDD with actual date)
ALTER TABLE vegetables_backup_20241220 RENAME TO vegetables;

-- 4. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_vegetables_owner_id ON vegetables(owner_id);
CREATE INDEX IF NOT EXISTS idx_vegetables_category ON vegetables(category);
-- ... (add other basic indexes)

-- 5. Update RLS policies
-- (Copy policies from your original schema.sql)
```

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

**Issue 1: Column already exists**

```
ERROR: column "unit" of relation "vegetables" already exists
```

**Solution:** This is normal - the script checks and skips existing columns

**Issue 2: Permission denied**

```
ERROR: permission denied for table vegetables
```

**Solution:** Ensure you're using an admin account with proper permissions

**Issue 3: Foreign key constraint fails**

```
ERROR: insert or update on table "vegetables" violates foreign key constraint
```

**Solution:** Check that `owner_id` references valid users in your users table

**Issue 4: RLS policy conflicts**

```
ERROR: policy "policy_name" for table "vegetables" already exists
```

**Solution:** The script drops and recreates policies - this is expected

---

## ✅ Verification Checklist

After migration, verify these items:

### **Database Structure**

- [ ] Vegetables table has 14+ columns
- [ ] New columns have correct data types
- [ ] Indexes are present and functional
- [ ] RLS policies are updated

### **Data Integrity**

- [ ] All existing vegetables still present
- [ ] No data corruption or loss
- [ ] Default values applied correctly
- [ ] Foreign key relationships intact

### **Application Functionality**

- [ ] Vegetable listing page works
- [ ] Create/edit vegetable forms work
- [ ] Search and filtering functional
- [ ] API endpoints responding correctly
- [ ] Mobile app compatibility maintained

### **Performance**

- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] New indexes improving performance

---

## 📞 Support & Next Steps

### **If Migration Successful**

1. Monitor application for 24-48 hours
2. Update your local schema documentation
3. Consider additional fields for future updates
4. Plan regular database maintenance

### **If Issues Persist**

1. Check Supabase logs in dashboard
2. Review error messages carefully
3. Use rollback procedure if necessary
4. Test in development environment first

### **Future Enhancements**

Consider adding these fields in future migrations:

- `nutrition_info` (JSONB) - Nutritional data
- `farmer_notes` (TEXT) - Growing conditions
- `certification` (VARCHAR) - Organic certifications
- `season_info` (JSONB) - Seasonal availability

---

## 📁 Related Files

| File                                                      | Purpose                  |
| --------------------------------------------------------- | ------------------------ |
| `database/migrate-vegetables-to-production.sql`           | Main migration script    |
| `database/verify-production-vegetables-schema.sql`        | Pre/post verification    |
| `src/db/schema.sql`                                       | Local development schema |
| `archive/sql-backups/05_production_deployment_script.sql` | Full production schema   |

---

## 🎉 Success!

Once completed, your production vegetables table will have:

- ✅ Enhanced schema with all local changes
- ✅ Backward compatibility maintained
- ✅ Improved data structure for future features
- ✅ Production-ready performance optimization

Your Arya Natural Farms marketplace is now ready for enhanced vegetable management! 🌱

---

_Last Updated: December 2024_  
_Version: 1.0 - Production Migration Guide_
