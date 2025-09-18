# 👑 Admin & Superadmin Farm Visit Rights Enhancement

## 🎯 Overview

Enhanced the farm visit system to ensure **Admins** and **Superadmins** have the same rights as **Sellers** when it comes to managing farm visits. This allows platform administrators to:

- Create and manage their own farm visit availability
- Help sellers manage their visits
- Create demonstration farms for platform testing
- Provide customer support for visit-related issues

## 🔧 Changes Made

### 1. Database Schema Updates

#### Enhanced Farm Profile Creation

```sql
-- Enable farm and garden visits for sellers, admins, and superadmins
UPDATE seller_farm_profiles
SET visit_booking_enabled = true, garden_visit_enabled = true
WHERE seller_id IN (
    SELECT id FROM users
    WHERE role IN ('seller', 'admin', 'superadmin')
);

-- Create seller farm profiles for admins and superadmins who don't have them yet
INSERT INTO seller_farm_profiles (
    seller_id,
    farm_name,
    farm_story,
    farm_type,
    detailed_location,
    farming_philosophy,
    visit_booking_enabled,
    garden_visit_enabled,
    public_profile,
    profile_verified
)
SELECT
    u.id,
    COALESCE(u.name || '''s Farm', 'Admin Farm'),
    'Administrative farm for platform management and demonstrations',
    'admin_farm',
    u.location,
    'Platform administration and user support',
    true,
    true,
    false, -- Not public by default for admin accounts
    true
FROM users u
WHERE u.role IN ('admin', 'superadmin')
AND NOT EXISTS (
    SELECT 1 FROM seller_farm_profiles sfp
    WHERE sfp.seller_id = u.id
);
```

### 2. API Permission Updates

#### Availability Management API

- **File**: `/src/app/api/farm-visits/availability/route.js`
- **Change**: Updated error message to include superadmins
- **Logic**: Admins and superadmins can create availability for themselves or specify seller_id for others

```javascript
// Only sellers, admins, and superadmins can create availability
if (!["seller", "admin", "superadmin"].includes(session.user.role)) {
  return NextResponse.json(
    {
      error:
        "Only sellers, admins, and superadmins can create availability slots",
    },
    { status: 403 }
  );
}

// For sellers, use their own ID. For admins/superadmins, allow specifying seller_id or use their own ID
const sellerId =
  session.user.role === "seller"
    ? session.user.id
    : formData.seller_id || session.user.id;
```

#### Farms Listing API

- **File**: `/src/app/api/farm-visits/farms/route.js`
- **Change**: Include admin and superadmin roles in farm listings

```javascript
// Before:
.eq("role", "seller")

// After:
.in("role", ["seller", "admin", "superadmin"])
```

### 3. User Interface Access

The existing UI already supports admin and superadmin access through role-based checks:

```javascript
// Management dashboard access
if (!["seller", "admin", "superadmin"].includes(session.user.role)) {
  // Access denied
}
```

## 👥 User Role Capabilities

### 🛡️ **Superadmin**

- **Full Access**: All farm visit management features
- **Create Availability**: For themselves or any seller
- **Manage All Requests**: View and update any visit request
- **Override Permissions**: Access to all system features
- **Demo Farms**: Can create demonstration farms for testing

### 🔧 **Admin**

- **Full Access**: All farm visit management features
- **Create Availability**: For themselves or any seller
- **Manage All Requests**: View and update any visit request
- **Support Role**: Help sellers with their visit management
- **Demo Farms**: Can create demonstration farms for customer support

### 🏪 **Seller**

- **Own Farm Management**: Create and manage their own availability
- **Own Requests**: View and manage requests for their farm
- **Limited Scope**: Cannot access other sellers' data

### 👤 **Buyer/User**

- **Browse & Request**: Can browse farms and request visits
- **Track Requests**: View their own visit requests
- **Limited Access**: Cannot create availability or manage others' requests

## 🎯 Use Cases

### **For Platform Administrators**

1. **Demo Farm Creation**

   - Create sample farms for showcasing platform features
   - Test new functionality before rolling out to sellers
   - Provide examples for new sellers

2. **Customer Support**

   - Help sellers create availability when they face issues
   - Manage problematic visit requests
   - Provide hands-on assistance to users

3. **Platform Testing**

   - Test the complete visit workflow
   - Verify system functionality across different scenarios
   - Quality assurance for new features

4. **Emergency Management**
   - Handle urgent visit cancellations
   - Manage system-wide issues
   - Provide backup support when sellers are unavailable

### **Default Admin Farm Properties**

- **Farm Name**: `{Admin Name}'s Farm` or "Admin Farm"
- **Farm Type**: `admin_farm`
- **Public Profile**: `false` (not visible to public by default)
- **Visit Enabled**: `true` for both farm and garden visits
- **Profile Verified**: `true` (auto-verified for admins)
- **Purpose**: Platform administration and user support

## 🔒 Security Considerations

### **Permission Inheritance**

- Admins inherit all seller permissions plus additional admin rights
- Superadmins inherit all admin permissions plus platform-wide access
- Role-based access control (RBAC) maintained throughout

### **Data Access**

- Admins can access any seller's farm data for support purposes
- Audit trail maintained for admin actions
- Privacy controls respected (admin farms not public by default)

### **Override Capabilities**

- Admins can override seller decisions when necessary
- System maintains log of who made changes
- Escalation path: User → Seller → Admin → Superadmin

## 📊 Database Impact

### **New Records Created**

- Admin farm profiles automatically created for existing admins
- All admin/superadmin accounts enabled for farm visits
- No impact on existing seller or user data

### **Performance Considerations**

- Minimal impact on query performance
- Additional role checking adds negligible overhead
- Database indexes remain optimized

## 🚀 Deployment Steps

### **1. Run Database Migration**

Execute the updated SQL script to:

- Add garden visit columns
- Enable visits for all eligible users
- Create admin farm profiles

### **2. Verify API Access**

Test that admins can:

- Create availability slots
- Manage visit requests
- Access farm management dashboard

### **3. Test User Interface**

Confirm that:

- Admin navigation links appear correctly
- Farm management features work for admins
- Permission checks function properly

### **4. Update Documentation**

- Update user guides for admin features
- Document new admin capabilities
- Provide training materials for support team

## ✅ Benefits

### **For Platform Management**

- **Better Support**: Admins can provide hands-on help
- **System Testing**: Internal testing capabilities
- **Quality Control**: Direct oversight of visit system
- **Flexibility**: Admins can handle edge cases

### **For Sellers**

- **Enhanced Support**: Direct admin assistance when needed
- **System Reliability**: Admin backup for critical issues
- **Learning Resources**: Demo farms for reference
- **Escalation Path**: Clear support hierarchy

### **For Users**

- **Better Experience**: Issues resolved faster with admin help
- **System Reliability**: Admins can handle urgent situations
- **More Options**: Access to admin demo farms if public
- **Quality Assurance**: Admin oversight ensures system quality

## 🎉 Summary

The farm visit system now provides **equal access rights** to admins and superadmins, enabling them to:

✅ Create and manage farm visit availability  
✅ Process and respond to visit requests  
✅ Access the full farm management dashboard  
✅ Provide comprehensive customer support  
✅ Test and demonstrate platform features

This enhancement ensures platform administrators have the tools they need to provide excellent user support while maintaining the security and integrity of the farm visit system.
