# Payment System Setup Guide

This guide will help you set up the payment system for the Arya Natural Farms application, including UPI QR code payments and screenshot verification.

## 🚀 Quick Setup (Phase 1 - UPI QR Payments)

### 1. Database Migration

First, apply the database schema changes to add payment functionality:

```bash
# Navigate to your Supabase dashboard or use the SQL editor
# Execute the contents of: database/add_payment_system.sql
```

Or run via psql:

```bash
psql "your-supabase-connection-string" -f database/add_payment_system.sql
```

### 2. Supabase Storage Setup

Create a storage bucket for payment screenshots:

#### Via Supabase Dashboard:

1. Go to Storage → Buckets
2. Create a new bucket named `order-attachments`
3. Configure bucket settings:
   - **Public**: No (private bucket)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

#### Via SQL (alternative):

```sql
-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-attachments',
  'order-attachments',
  false,
  5242880,  -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Create RLS policies for the bucket
CREATE POLICY "Users can upload payment screenshots" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'order-attachments'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view payment screenshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-attachments'
    AND (
      auth.uid() IS NOT NULL OR
      EXISTS (
        SELECT 1 FROM payment_transactions pt
        WHERE pt.screenshot_url LIKE '%' || name || '%'
      )
    )
  );

CREATE POLICY "Sellers and admins can view payment screenshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-attachments'
    AND (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('seller', 'admin'))
    )
  );
```

### 3. Seller UPI Setup

Each seller needs to configure their UPI payment method:

#### For existing sellers:

1. Go to `/payment-verification` (sellers/admins only)
2. Add UPI payment method with:
   - UPI ID (e.g., `9876543210@paytm`)
   - Account holder name
   - Display name

#### Via API (programmatic):

```javascript
// POST /api/payments/payment-methods
{
  "methodType": "upi",
  "upiId": "seller@paytm",
  "accountHolderName": "Seller Name",
  "displayName": "Seller Farm UPI"
}
```

### 4. Navigation Updates

Add payment verification links to your navigation:

```jsx
// For sellers and admins in header/navigation
{
  (userRole === "seller" || userRole === "admin") && (
    <Link href="/payment-verification" className="nav-link">
      <i className="ti-credit-card me-1"></i>
      Payment Verification
    </Link>
  );
}
```

## 🔧 Advanced Setup (Phase 2 - Razorpay Integration)

### 1. Razorpay Account Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Get API credentials:
   - Key ID
   - Key Secret
3. Configure webhooks for payment verification

### 2. Environment Variables

Add to your environment:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### 3. Razorpay Integration Files

Create the following API endpoints:

```
src/app/api/payments/razorpay/
├── create-order/route.js
├── verify-payment/route.js
└── webhook/route.js
```

## 📱 Features Overview

### ✅ Phase 1 - UPI QR Payments (Ready)

- Generate UPI QR codes for orders
- Support for all UPI apps (GPay, PhonePe, Paytm, etc.)
- Screenshot upload for payment proof
- Manual verification by sellers/admins
- Order status tracking with payment states

### 🔄 Phase 2 - Razorpay Integration (Future)

- Automated payment processing
- Credit/debit card support
- Net banking integration
- Automatic order confirmation
- Refund management

## 🎯 User Flow

### Customer Payment Process:

1. **Add items to cart** → Proceed to checkout
2. **Fill delivery details** → Continue to payment
3. **Choose UPI QR payment** → Scan QR code
4. **Make payment** in UPI app → Take screenshot
5. **Upload screenshot** → Wait for verification
6. **Order confirmed** after seller approval

### Seller Verification Process:

1. **Access payment verification** page
2. **Review pending payments** with screenshots
3. **Verify payment amount** and details
4. **Approve/reject payment** → Order status updated
5. **Customer notified** of confirmation

## 🔒 Security Features

- **RLS Policies**: Database-level security for all payment data
- **File Upload Validation**: Size and type restrictions for screenshots
- **Transaction Logging**: Complete audit trail of all payment actions
- **Role-Based Access**: Only sellers/admins can verify payments
- **Secure Storage**: Private bucket for sensitive payment screenshots

## 🎨 UI Components

All payment components are built with Bootstrap 5 and integrate seamlessly:

- **UpiQrPayment**: Complete QR code generation and payment flow
- **PaymentVerification**: Admin/seller verification interface
- **Enhanced CheckoutForm**: Two-step checkout with payment options
- **Payment method management**: For sellers to configure UPI details

## 📊 Payment States

### Order Status Flow:

```
pending → payment_pending → payment_received → confirmed → processing → delivered
```

### Payment Status Flow:

```
pending → manual_verification → success/failed
```

## 🚨 Troubleshooting

### Common Issues:

1. **QR Code not generating**

   - Check seller has valid UPI payment method
   - Verify UPI ID format (username@provider)

2. **Screenshot upload failing**

   - Ensure `order-attachments` bucket exists
   - Check file size (<5MB) and format (JPG/PNG)
   - Verify storage policies are set correctly

3. **Payment verification not accessible**

   - Confirm user role is 'seller' or 'admin'
   - Check navigation links and route protection

4. **Database errors**
   - Ensure migration script ran successfully
   - Check all required tables exist with proper constraints

## 📈 Testing

### Test the complete flow:

1. **Create test order** as customer
2. **Generate QR code** and verify it opens in UPI apps
3. **Upload test screenshot** (any image will work)
4. **Access verification page** as seller
5. **Approve payment** and confirm order status updates

## 🔄 Migration Commands

Run these in order:

```sql
-- 1. Apply payment system schema
\i database/add_payment_system.sql

-- 2. Verify tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%payment%';

-- 3. Check sample data
SELECT count(*) FROM payment_methods;
SELECT count(*) FROM payment_transactions;

-- 4. Test RLS policies
SET ROLE authenticated;
SELECT * FROM payment_methods WHERE seller_id = 'some-uuid';
```

## 🎉 Go Live Checklist

- [ ] Database migration applied successfully
- [ ] Storage bucket `order-attachments` created with proper policies
- [ ] All sellers have configured UPI payment methods
- [ ] Payment verification page accessible to sellers/admins
- [ ] Test order flow completed end-to-end
- [ ] Navigation links updated
- [ ] Screenshots uploading and displaying correctly
- [ ] Order status updates working after payment verification

---

**Ready to accept payments!** 🚀

The UPI QR system provides a simple, no-transaction-fee solution that works with all popular payment apps in India. Customers can pay easily and sellers can verify payments through a clean admin interface.
