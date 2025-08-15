# Mobile Number Authentication Setup Guide

This document provides step-by-step instructions for setting up and testing the mobile number authentication feature in GreenSpace.

## Features Added

✅ **Mobile Number Login with OTP**

- Users can login using their mobile/WhatsApp number
- Secure OTP verification via SMS
- Automatic user creation for new mobile users

✅ **Enhanced Order Flow**

- Mobile users can place orders just like Google users
- WhatsApp integration for order communications
- Seller can easily contact customers via WhatsApp

✅ **Dual Authentication Support**

- Google OAuth (existing)
- Mobile number + OTP (new)
- Seamless switching between methods

## Setup Instructions

### 1. Database Migration

Run the database migration to add OTP support:

```sql
-- Execute the migration file
\i src/db/migrations/add_otp_verification.sql
```

This will:

- Create `otp_verifications` table for OTP management
- Make email field optional in users table
- Add phone_number and provider fields
- Add necessary indexes and constraints

### 2. Environment Variables

Add the following environment variables for SMS functionality:

```env
# Twilio SMS Configuration (Optional - for production)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# NextAuth Configuration (Existing)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Supabase Configuration (Existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Development Mode

In development mode, OTP codes are displayed in the console instead of sending SMS. This allows for easy testing without SMS costs.

## Testing the Feature

### 1. Access Login Page

Navigate to `/login` and you'll see two tabs:

- **Google**: Existing Google OAuth
- **Mobile**: New mobile number authentication

### 2. Mobile Login Flow

1. Click on "Mobile" tab
2. Enter a 10-digit Indian mobile number (e.g., 9876543210)
3. Click "Send OTP"
4. In development mode, check the console for the OTP code
5. Enter the 6-digit OTP
6. Click "Verify & Login"

### 3. User Experience

**New Mobile Users:**

- Automatically created in database
- Default name: "User XXXX" (last 4 digits)
- Can update profile later

**Existing Mobile Users:**

- Instant login after OTP verification
- All previous order history available

### 4. Order Placement

Mobile users can:

- Browse products
- Add items to cart
- Place orders (same flow as Google users)
- Track order status
- Communicate with sellers via WhatsApp

### 5. WhatsApp Integration

**For Buyers:**

- Contact seller directly from order details
- Quick message templates (status inquiry, issues, delivery updates)

**For Sellers:**

- Send order status updates to customers
- Custom messages for order communication
- Automatic message templates for different order statuses

## API Endpoints

### Mobile Authentication

- `POST /api/auth/mobile/send-otp`

  - Body: `{ "phoneNumber": "9876543210" }`
  - Response: `{ "success": true, "message": "OTP sent successfully" }`

- `POST /api/auth/mobile/verify-otp`
  - Body: `{ "phoneNumber": "9876543210", "otpCode": "123456" }`
  - Response: `{ "success": true, "phoneNumber": "9876543210" }`

### NextAuth Integration

Mobile authentication is integrated with NextAuth as a custom credentials provider:

```javascript
// Sign in with mobile
await signIn("mobile", {
  phoneNumber: "9876543210",
  otpCode: "123456",
  redirect: false,
});
```

## Database Schema Updates

### New Tables

**otp_verifications:**

- `id` (UUID): Primary key
- `phone_number` (VARCHAR): Mobile number
- `otp_code` (VARCHAR): 6-digit OTP
- `expires_at` (TIMESTAMP): Expiry time (5 minutes)
- `verified` (BOOLEAN): Verification status
- `attempts` (INTEGER): Failed attempts counter

### Updated Tables

**users:**

- `email` (VARCHAR): Now optional
- `phone_number` (VARCHAR): Mobile number (optional)
- `provider` (VARCHAR): Auth provider ('google' or 'mobile')

## Security Features

### OTP Security

- 6-digit random OTP generation
- 5-minute expiry time
- Maximum 3 verification attempts
- Automatic cleanup of expired OTPs

### Phone Number Validation

- Supports 10-digit Indian mobile numbers
- Validates format: starting with 6-9
- Handles international format (+91)

### Session Management

- Seamless integration with NextAuth
- Mobile users get same session structure as Google users
- Proper role-based access control

## Troubleshooting

### Common Issues

1. **OTP not received in development:**

   - Check console logs for OTP code
   - Ensure NODE_ENV=development

2. **Database errors:**

   - Run the migration script
   - Check Supabase connection
   - Verify RLS policies

3. **Session issues:**
   - Clear browser cookies
   - Restart Next.js server
   - Check NextAuth configuration

### Debug Mode

Enable debug logging by setting:

```env
NEXTAUTH_DEBUG=true
```

## Production Deployment

### SMS Provider Setup

1. **Twilio Setup:**

   - Create Twilio account
   - Get Account SID and Auth Token
   - Purchase a phone number
   - Add credentials to environment variables

2. **Alternative SMS Providers:**
   - Update `OtpService.js` to integrate other providers
   - Implement provider-specific message sending

### Security Considerations

- Rate limiting for OTP requests
- Phone number verification
- Fraud detection for suspicious patterns
- GDPR compliance for phone number storage

## File Structure

```
src/
├── app/api/auth/
│   ├── mobile/
│   │   ├── send-otp/route.js
│   │   └── verify-otp/route.js
│   └── options.js (updated)
├── components/
│   ├── auth/
│   │   └── MobileLoginForm.js
│   └── features/orders/
│       └── WhatsAppActions.js
├── services/
│   └── OtpService.js
└── db/migrations/
    └── add_otp_verification.sql
```

## Future Enhancements

### Planned Features

- WhatsApp Business API integration
- Automated order notifications
- Multi-language SMS support
- Advanced fraud detection
- SMS templates customization

### Possible Improvements

- Social login with mobile verification
- Two-factor authentication
- SMS delivery status tracking
- Custom OTP length configuration
- Regional phone number support

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review console logs for errors
3. Verify environment variables
4. Test with different phone numbers

---

**Note:** This feature enhances the existing authentication system without breaking Google OAuth functionality. Both authentication methods work seamlessly together.
