# 🌱 Real Seller Verification Workflow Guide

## 📋 Complete Seller Journey - From Registration to Approval

This guide shows you how to validate the actual seller verification process with real data.

---

## 🚀 **Phase 1: User Registration & Seller Application**

### Step 1: User Creates Account

```javascript
// User registers through your normal authentication
// Either Google OAuth or Mobile OTP
// User gets basic "user" role initially
```

### Step 2: User Accesses Seller Registration Form

Create a route for sellers to apply:

```jsx
// src/app/become-seller/page.js
"use client";

import NaturalFarmingSellerForm from "@/components/features/sellers/NaturalFarmingSellerForm";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function BecomeSellerPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (!session) redirect("/login");

  const handleSuccess = () => {
    // Redirect to success page or dashboard
    window.location.href = "/seller-application-submitted";
  };

  return (
    <div>
      <NaturalFarmingSellerForm
        onSuccess={handleSuccess}
        userInfo={{
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone,
          location: session.user.location,
        }}
      />
    </div>
  );
}
```

### Step 3: Real Data Submission Flow

When user submits the form, here's what happens:

```javascript
// 1. Frontend collects form data
const formData = {
  // Business Info
  business_name: "Fresh Valley Organic Farm",
  business_description:
    "We grow chemical-free vegetables using traditional methods...",
  location: "Mysore, Karnataka",
  contact_number: "919876543210",
  whatsapp_number: "919876543210",

  // Farm Details
  farm_name: "Fresh Valley Farm",
  farm_description:
    "Family-owned 5-acre farm specializing in organic vegetables",
  farming_methods: ["organic", "natural", "pesticide_free"],
  farm_size_acres: 5.2,
  years_farming: 12,
  certifications: ["organic_certified"],

  // Growing Practices
  growing_practices:
    "We use cow dung manure, compost, neem oil for pest control...",
  soil_management:
    "Regular composting, crop rotation, natural fertilizers only",
  pest_management: "Neem oil, companion planting, beneficial insects",
  water_source: "borewell",
  seasonal_calendar:
    "Summer: tomatoes, peppers | Winter: leafy greens, cauliflower",

  // Verification
  farm_photos: [
    "https://storage.url/farm1.jpg",
    "https://storage.url/farm2.jpg",
  ],
  farm_visit_available: true,
  farm_visit_address: "Fresh Valley Farm, Village Road, Mysore",
  preferred_visit_times: "Weekends 9 AM - 5 PM, call ahead",
};

// 2. API call to create seller request
const response = await fetch("/api/seller-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});
```

---

## 🔍 **Phase 2: Database Records Created**

After form submission, check what got created:

### Check Seller Request Record

```sql
-- In Supabase SQL Editor
SELECT
    sr.*,
    u.name as applicant_name,
    u.email as applicant_email
FROM seller_requests sr
JOIN users u ON sr.user_id = u.id
ORDER BY sr.created_at DESC
LIMIT 5;
```

### Check Farm Profile Created

```sql
-- Check if farm profile was auto-created
SELECT * FROM seller_farm_profiles
WHERE seller_id IN (
    SELECT user_id FROM seller_requests
    ORDER BY created_at DESC LIMIT 1
);
```

---

## 👨‍💼 **Phase 3: Admin Review Process**

### Step 1: Admin Accesses Review Dashboard

Create admin route:

```jsx
// src/app/admin/seller-verification/page.js
import SellerVerificationDashboard from "@/components/features/admin/SellerVerificationDashboard";
import AdminGuard from "@/components/common/AdminGuard";

export default function AdminSellerVerificationPage() {
  return (
    <AdminGuard>
      <SellerVerificationDashboard />
    </AdminGuard>
  );
}
```

### Step 2: Admin Reviews Application

Admin can see:

- ✅ Application details
- ✅ Farm photos in carousel
- ✅ Growing practices description
- ✅ Farming methods selected
- ✅ Contact information

### Step 3: Admin Makes Decision

```javascript
// When admin clicks "Approve"
const reviewData = {
  status: "basic_verified", // or "farm_verified", "rejected"
  review_notes: "Farm looks authentic, good organic practices documented",
  approved: true,
};

// API call to review endpoint
const response = await fetch(`/api/admin/seller-requests/${requestId}/review`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(reviewData),
});
```

---

## ✅ **Phase 4: Approval Process Actions**

When admin approves, several things happen automatically:

### 1. User Role Updated

```sql
-- User role changed from "user" to "seller"
UPDATE users SET role = 'seller' WHERE id = 'user-id';
```

### 2. Initial Badge Awarded

```sql
-- Verification badge automatically created
INSERT INTO seller_verification_badges (
    seller_id, badge_type, badge_name, badge_description,
    verified_by, verification_notes
) VALUES (
    'user-id', 'verified_natural', 'Verified Natural Farmer',
    'Awarded upon basic_verified verification', 'admin-id',
    'Automatically awarded upon basic_verified approval'
);
```

### 3. Farm Profile Updated

```sql
-- Farm profile marked as verified
UPDATE seller_farm_profiles
SET profile_verified = true,
    last_verification_date = NOW(),
    verification_notes = 'review notes here'
WHERE seller_id = 'user-id';
```

---

## 🧪 **How to Test with Real Data**

### Test Scenario 1: Complete Seller Journey

1. **Create Test User Account**

```javascript
// Register new account or use existing
// Email: test.farmer@example.com
// Name: Test Farmer
// Role: user (initially)
```

2. **Submit Real Seller Application**

```bash
# Visit: /become-seller
# Fill out complete form with realistic data:
# - Farm name: "Test Organic Farm"
# - Location: "Bangalore, Karnataka"
# - Years farming: 8
# - Methods: ["natural", "pesticide_free"]
# - Upload 2-3 farm photos
# - Enable farm visits
```

3. **Verify Database Records**

```sql
-- Check seller request created
SELECT * FROM seller_requests
WHERE user_id = (SELECT id FROM users WHERE email = 'test.farmer@example.com');

-- Check farm profile created
SELECT * FROM seller_farm_profiles
WHERE seller_id = (SELECT id FROM users WHERE email = 'test.farmer@example.com');
```

4. **Admin Reviews & Approves**

```bash
# Login as admin user
# Visit: /admin/seller-verification
# Review the test application
# Add notes: "Test application - approved for testing"
# Click "Approve" with "basic_verified" level
```

5. **Verify Approval Results**

```sql
-- Check user role updated
SELECT email, name, role FROM users WHERE email = 'test.farmer@example.com';

-- Check badge awarded
SELECT * FROM seller_verification_badges
WHERE seller_id = (SELECT id FROM users WHERE email = 'test.farmer@example.com');

-- Check request status updated
SELECT status, verification_level, review_notes FROM seller_requests
WHERE user_id = (SELECT id FROM users WHERE email = 'test.farmer@example.com');
```

### Test Scenario 2: API Testing with cURL

```bash
# 1. Create seller request
curl -X POST http://localhost:3000/api/seller-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "business_name": "Real Farm Test",
    "farm_name": "Test Farm",
    "farming_methods": ["natural", "organic"],
    "years_farming": 5,
    "growing_practices": "Chemical-free sustainable methods",
    "farm_photos": ["https://example.com/photo1.jpg"]
  }'

# 2. Get seller requests (admin only)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/admin/seller-requests

# 3. Approve seller request
curl -X PATCH http://localhost:3000/api/admin/seller-requests/REQUEST_ID/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "basic_verified",
    "review_notes": "Approved for testing",
    "approved": true
  }'
```

---

## 📊 **Validation Checklist for Real Sellers**

### ✅ Application Submission

- [ ] Form validates all required fields
- [ ] File uploads work (farm photos)
- [ ] Data saves to seller_requests table
- [ ] Farm profile auto-created
- [ ] User receives success confirmation

### ✅ Admin Review

- [ ] Admin can see application in dashboard
- [ ] Farm photos display in carousel
- [ ] All application data visible
- [ ] Approve/reject actions work
- [ ] Review notes save properly

### ✅ Approval Process

- [ ] User role updates to "seller"
- [ ] Initial badge awarded automatically
- [ ] Farm profile marked verified
- [ ] Seller request status updated

### ✅ Post-Approval

- [ ] Seller can access seller features
- [ ] Trust profile displays correctly
- [ ] Badge shows in seller profile
- [ ] Farm profile is public

---

## 🔍 **Debugging Real Issues**

### Common Issues & Solutions

**Issue**: Seller request not saving

```sql
-- Check if user exists and has valid session
SELECT id, email, role FROM users WHERE email = 'seller.email@example.com';

-- Check for constraint violations
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'seller_requests';
```

**Issue**: Admin can't see applications

```sql
-- Check admin user role
SELECT email, role FROM users WHERE email = 'admin@example.com';

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual
FROM pg_policies WHERE tablename = 'seller_requests';
```

**Issue**: Badge not awarded on approval

```sql
-- Check if badge table exists
SELECT COUNT(*) FROM seller_verification_badges;

-- Check badge creation logs
SELECT * FROM seller_verification_badges
WHERE seller_id = 'user-id'
ORDER BY earned_date DESC;
```

---

## 📝 **Real Data Examples**

### Sample Real Seller Application

```json
{
  "business_name": "Krishnan Organic Gardens",
  "business_description": "Family-run organic farm established in 2015. We specialize in pesticide-free vegetables using traditional Kerala farming methods passed down through generations.",

  "farm_name": "Krishnan Gardens",
  "farm_description": "Located in the lush hills of Wayanad, our 8-acre farm grows over 20 varieties of vegetables using only natural fertilizers and traditional pest control.",

  "location": "Wayanad, Kerala",
  "contact_number": "919876543210",
  "whatsapp_number": "919876543210",

  "farming_methods": ["organic", "traditional", "pesticide_free"],
  "farm_size_acres": 8.5,
  "years_farming": 15,
  "certifications": ["organic_certified"],

  "growing_practices": "We use only cow dung manure, kitchen waste compost, and green manure. Seeds are sourced from heirloom varieties. Crop rotation is practiced religiously.",

  "soil_management": "Regular addition of organic matter through composting. Green manuring with legumes. No chemical fertilizers ever used.",

  "pest_management": "Neem oil applications, companion planting (marigolds with tomatoes), encouraging beneficial insects, physical barriers like nets.",

  "water_source": "rainwater",
  "seasonal_calendar": "Monsoon: Leafy greens, gourds | Post-monsoon: Tomatoes, peppers, beans | Summer: Heat-resistant varieties with drip irrigation",

  "farm_photos": [
    "https://storage.url/krishnan-farm-overview.jpg",
    "https://storage.url/organic-tomatoes-growing.jpg",
    "https://storage.url/compost-preparation.jpg",
    "https://storage.url/natural-pest-control.jpg"
  ],

  "farm_visit_available": true,
  "farm_visit_address": "Krishnan Organic Gardens, Hill View Road, Wayanad, Kerala 673121",
  "preferred_visit_times": "Saturdays and Sundays, 8 AM to 6 PM. Please call 2 days in advance."
}
```

This workflow ensures every real seller goes through proper verification while maintaining the open registration you want! 🌱
