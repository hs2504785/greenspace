# PWA and Push Notifications Setup Guide

This guide explains how to complete the setup of PWA (Progressive Web App) and push notifications for Arya Natural Farms.

## 🔧 Environment Variables Setup

### Step 1: Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using:

```bash
npx web-push generate-vapid-keys
```

This will output something like:

```
Public Key: BLmnXSXuViEnpCqIlp29eetLJo-IX1_h9n2N8wJZ-Dr2IedEzeta-8djyhAEcgVNMb6k3R-yb67-w6JDd6bLb3g
Private Key: 96cR3oH4LydSyTEdc-AyKBD7bwcvomShxRizNeI2l0A
```

### Step 2: Add to Environment Variables

Add these keys to your `.env.local` file:

```env
# PWA Push Notification Configuration
# Public key (accessible by client-side code)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLmnXSXuViEnpCqIlp29eetLJo-IX1_h9n2N8wJZ-Dr2IedEzeta-8djyhAEcgVNMb6k3R-yb67-w6JDd6bLb3g

# Private key (server-side only - keep secret!)
VAPID_PRIVATE_KEY=96cR3oH4LydSyTEdc-AyKBD7bwcvomShxRizNeI2l0A

# Optional: Contact email for VAPID
VAPID_EMAIL=mailto:admin@aryanaturalarms.com
```

**Important Notes:**

- The public key MUST have the `NEXT_PUBLIC_` prefix to be accessible by client-side code
- The private key should NEVER be exposed to the client
- Generate your own keys - don't use the example keys above in production

## 🗄️ Database Setup

### Step 1: Run the Migration

Execute the notification system migration:

```sql
-- In your PostgreSQL/Supabase SQL editor
\i src/db/migrations/add_notifications_system.sql
```

Or copy and paste the contents of `src/db/migrations/add_notifications_system.sql` into your Supabase SQL editor.

### Step 2: Verify Tables

Ensure these tables were created:

- `push_subscriptions` - Stores user push notification subscriptions
- `notification_preferences` - User notification preferences
- `notifications` - Log of all notifications sent

## 🔧 Using the Notification Settings Component

### Add to Profile Page

Add the NotificationSettings component to your user profile page:

```javascript
// In src/app/profile/page.js or wherever you want to show settings
import NotificationSettings from "@/components/features/notifications/NotificationSettings";

export default function ProfilePage() {
  return (
    <div>
      {/* Your existing profile content */}

      <NotificationSettings />
    </div>
  );
}
```

### Add to Settings Page

Or create a dedicated notifications settings page:

```javascript
// src/app/notifications/page.js
import NotificationSettings from "@/components/features/notifications/NotificationSettings";

export default function NotificationsPage() {
  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
}
```

## 🧪 Testing the System

### 1. Test PWA Installation

1. Open your app in Chrome/Edge
2. Look for the "Install App" icon in the address bar
3. Install the PWA
4. Test that it works offline

### 2. Test Push Notifications

1. Go to the notification settings page
2. Click "Enable" push notifications
3. Grant permission when prompted
4. Click "Test" to send a test notification
5. As a seller, add a new product
6. Check that buyers receive notifications

### 3. Test Different Browsers

- **Chrome/Edge**: Full PWA and push notification support
- **Firefox**: PWA and push notifications work
- **Safari**: PWA works, push notifications have some limitations
- **Mobile browsers**: Test installation and notifications

## 🔍 Debugging

### Check Browser Console

Look for these logs:

- `✅ Notifications sent successfully`
- `🔔 Triggering notifications for new product`
- Service worker registration messages

### Check Network Tab

When adding a product, you should see:

- POST to `/api/notifications/send-product-notification`
- Successful responses (200 status)

### Notification Troubleshooting

**If notifications aren't working:**

1. **Check VAPID keys** - Ensure they're set correctly
2. **Check permissions** - User must grant notification permission
3. **Check browser support** - Use modern browsers
4. **Check HTTPS** - Push notifications require HTTPS (except localhost)
5. **Check service worker** - Ensure it's registered and active

**Common Issues:**

- **VAPID keys missing**: Add them to environment variables
- **Permission denied**: User needs to grant permission in browser settings
- **Service worker not registered**: Check console for registration errors
- **HTTPS required**: Deploy to HTTPS or test on localhost only

## 📱 PWA Features Included

✅ **App Manifest** - Makes app installable  
✅ **Service Worker** - Enables offline functionality  
✅ **Push Notifications** - Real-time notifications  
✅ **Caching Strategy** - Optimized loading  
✅ **Icons & Splash Screens** - Native app feel  
✅ **Offline Support** - Works without internet  
✅ **Auto-updates** - Service worker updates

## 🚀 Production Deployment

### Vercel/Netlify

1. Add environment variables to deployment settings
2. Ensure HTTPS is enabled
3. Test PWA functionality after deployment

### Custom Server

1. Configure HTTPS certificates
2. Set environment variables
3. Ensure proper Content-Security-Policy headers

## 📈 Monitoring

Monitor notification performance:

1. Check notification delivery rates in logs
2. Monitor user subscription/unsubscription rates
3. Track PWA installation rates
4. Check for failed notification attempts

## 🎯 Next Steps

1. **Customize notifications** - Add product images, better formatting
2. **Email notifications** - Implement email fallback
3. **Notification history** - Show users their notification history
4. **Advanced targeting** - Location-based, interest-based notifications
5. **Analytics** - Track notification engagement rates

---

## Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Ensure database migration ran successfully
4. Test in incognito mode to rule out cache issues
