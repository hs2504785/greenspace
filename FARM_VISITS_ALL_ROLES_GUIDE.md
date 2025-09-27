# 🌱 Farm Visits: Complete Multi-Role Setup Guide

## 🎯 Overview

This guide ensures that the Farm Visits system works properly for **all user roles**:

- 👑 **Superadmin** - Full platform control
- 🔧 **Admin** - Platform management
- 🏪 **Seller** - Farm management
- 👤 **Buyer** - Visit requests

## 🔍 Current Issue Analysis

### ✅ What's Working:

- API endpoints have proper role-based permissions
- Availability data is being created correctly
- UI components have role access controls

### ❌ What's Broken:

- **Arya Natural Farms** has availability but no farm profile
- Admin/Superadmin profiles created with `public_profile = false`
- Farms API filters out non-public profiles

### 🧪 Test Results:

```
🔍 Farms API (Public): ✅ Found 1 farms (seller: Tanya Singh)
🔍 Farms API (With Availability): ❌ Found 0 farms
🔍 Availability API: ✅ Found 1 slots (Arya Natural Farms: 1 slots)
```

**Problem**: Availability exists but farm doesn't appear because no public profile!

## 🛠️ Complete Solution

### 1. **Database Fix (Required)**

Run this SQL in your Supabase SQL Editor:

```sql
-- File: database/fix_farm_visits_all_roles.sql
```

This script will:

- ✅ Create missing farm profiles for admin/superadmin
- ✅ Set `public_profile = true` for all roles
- ✅ Enable `visit_booking_enabled = true`
- ✅ Fix the specific Arya Natural Farms case

### 2. **API Permissions (Already Correct)**

All API endpoints properly support all roles:

```javascript
// ✅ Availability Management
if (!["seller", "admin", "superadmin"].includes(session.user.role)) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}

// ✅ Farms Listing
.in("role", ["seller", "admin", "superadmin"])

// ✅ Request Management
if (session.user.role === "buyer") {
  query = query.eq("user_id", session.user.id);
} else if (session.user.role === "seller") {
  query = query.eq("seller_id", session.user.id);
} else if (session.user.role === "admin" || session.user.role === "superadmin") {
  // Can see all requests
}
```

### 3. **UI Access Controls (Already Correct)**

```javascript
// ✅ Management Page Access
if (!["seller", "admin", "superadmin"].includes(session.user.role)) {
  return <AccessDenied />;
}
```

## 👥 Role Capabilities Matrix

| Feature                     | Buyer | Seller | Admin | Superadmin |
| --------------------------- | ----- | ------ | ----- | ---------- |
| **Browse Farms**            | ✅    | ✅     | ✅    | ✅         |
| **Request Visits**          | ✅    | ✅     | ✅    | ✅         |
| **View Own Requests**       | ✅    | ✅     | ✅    | ✅         |
| **Create Own Availability** | ❌    | ✅     | ✅    | ✅         |
| **Manage Own Requests**     | ❌    | ✅     | ✅    | ✅         |
| **View All Requests**       | ❌    | ❌     | ✅    | ✅         |
| **Manage Any Availability** | ❌    | ❌     | ✅    | ✅         |
| **Override Permissions**    | ❌    | ❌     | ✅    | ✅         |

## 🔧 Implementation Details

### **Database Schema Requirements**

Every user with farm visit capabilities needs:

```sql
-- seller_farm_profiles table
{
  seller_id: UUID,              -- User ID
  public_profile: true,         -- MUST be true to appear in listings
  visit_booking_enabled: true,  -- MUST be true for farm visits
  garden_visit_enabled: true,   -- Optional for garden visits
  farm_name: "Farm Name",       -- Display name
  profile_verified: true        -- Recommended for trust
}
```

### **API Endpoint Logic**

1. **GET /api/farm-visits/farms**

   ```javascript
   // Filters farms by:
   .in("role", ["seller", "admin", "superadmin"])
   .eq("seller_farm_profiles.public_profile", true)

   // Then filters by visit capabilities:
   profile.visit_booking_enabled || profile.garden_visit_enabled
   ```

2. **GET /api/farm-visits/availability**

   ```javascript
   // No role restrictions - public endpoint
   // Returns all available slots
   ```

3. **POST /api/farm-visits/availability**
   ```javascript
   // Role-based creation:
   if (session.user.role === "seller") {
     sellerId = session.user.id; // Own only
   } else if (["admin", "superadmin"].includes(session.user.role)) {
     sellerId = formData.seller_id || session.user.id; // Any seller
   }
   ```

## 🧪 Testing & Verification

### **1. Run the Test Script**

```bash
node scripts/test-farm-visits-all-roles.js
```

### **2. Expected Results After Fix**

```
🔍 Farms API (Public): ✅ Found 3+ farms
   - seller: Tanya Singh
   - superadmin: Arya Natural Farms
   - admin: [Admin Name]

🔍 Farms API (With Availability): ✅ Found 1+ farms
   - superadmin: Arya Natural Farms

🔍 Availability API: ✅ Found 1+ slots
   - Arya Natural Farms: 1 slots
```

### **3. Manual Testing Checklist**

**As Superadmin:**

- [ ] Can access `/farm-visits/manage`
- [ ] Can create availability slots
- [ ] Can view all requests
- [ ] Appears in farm listings

**As Admin:**

- [ ] Can access `/farm-visits/manage`
- [ ] Can create availability slots
- [ ] Can view all requests
- [ ] Appears in farm listings

**As Seller:**

- [ ] Can access `/farm-visits/manage`
- [ ] Can create own availability slots
- [ ] Can view own requests only
- [ ] Appears in farm listings

**As Buyer:**

- [ ] Can browse `/farm-visits`
- [ ] Can request visits
- [ ] Can view `/my-visits`
- [ ] Cannot access `/farm-visits/manage`

## 🚀 Deployment Steps

### **Step 1: Database Migration**

```sql
-- Run in Supabase SQL Editor
-- File: database/fix_farm_visits_all_roles.sql
```

### **Step 2: Verify API Responses**

```bash
# Should return farms from all roles
curl "https://aryanaturalfarms.vercel.app/api/farm-visits/farms"

# Should return Arya Natural Farms
curl "https://aryanaturalfarms.vercel.app/api/farm-visits/farms?hasAvailability=true"
```

### **Step 3: Test UI Access**

- Visit `/farm-visits` - should show farms
- Visit `/farm-visits/manage` as admin/seller - should work
- Create availability as admin/superadmin - should work

## 📋 Troubleshooting

### **Issue: Farm has availability but doesn't appear**

**Cause**: Missing farm profile or `public_profile = false`
**Fix**: Run the database migration script

### **Issue: Access denied for admin/superadmin**

**Cause**: Role not included in permission checks
**Fix**: Verify API routes include all roles in checks

### **Issue: Can't create availability**

**Cause**: Missing farm profile
**Fix**: Ensure user has `seller_farm_profiles` record

### **Issue: Availability appears but farm doesn't**

**Cause**: Profile exists but `public_profile = false`
**Fix**: Update `public_profile = true` in database

## ✅ Success Criteria

After implementing this guide:

1. **All roles can access appropriate features**
2. **Arya Natural Farms appears in farm listings**
3. **Admin/Superadmin can create and manage visits**
4. **API endpoints return expected data for all roles**
5. **UI components show/hide based on user role**

## 🎯 Next Steps

1. **Run the database migration** - `database/fix_farm_visits_all_roles.sql`
2. **Test with the script** - `node scripts/test-farm-visits-all-roles.js`
3. **Verify in browser** - Check all role-based functionality
4. **Monitor production** - Ensure no regressions

---

**🎉 After this setup, farm visits will work seamlessly for all user roles!**
