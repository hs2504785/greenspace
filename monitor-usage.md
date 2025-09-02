# 📊 Google Maps Usage Monitoring

## 🛡️ Cost Protection Checklist

### ✅ **Immediate Actions (Do These Now):**

1. **Set Billing Budgets:**

   - Go to: https://console.cloud.google.com/billing/budgets
   - Create budget: $10 USD with alerts at 50%, 90%, 100%
   - Create second budget: $50 USD with alerts at 90%, 100%

2. **Restrict API Key:**

   - Go to: https://console.cloud.google.com/apis/credentials
   - Click your API key: `AIzaSyCk_rgTTvnCQiW18jk0VhLPNl-SJopaT14`
   - Add HTTP referrer restrictions for your domain
   - Restrict to "Maps JavaScript API" only

3. **Set Usage Quotas:**
   - Go to: https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/quotas
   - Set "Map loads per day" to 1,000 requests
   - Set "Map loads per 100 seconds per user" to 100 requests

### 📊 **Usage Monitoring:**

**Check usage weekly:**

- Go to: https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/metrics
- Monitor "Requests" graph
- Normal usage: 10-100 requests/day for small community

### 🚨 **Warning Signs:**

- **>500 requests/day**: Investigate unusual activity
- **>1000 requests/day**: Check for bugs or abuse
- **Any billing alerts**: Review usage immediately

### 💰 **Cost Estimates:**

- **Maps JavaScript API**: $7 per 1,000 loads
- **Your likely usage**: 50-200 loads/day = $1-4/month
- **Free credit**: $200/month covers ~28,571 loads
- **Realistic cost**: $0/month for typical community usage

### 🔧 **Emergency Shutdown:**

If you see unexpected usage:

1. **Disable API key immediately** in Google Cloud Console
2. **Comment out key in .env.local**: `# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...`
3. **Restart your app** - it will fall back to the safe list view

### 📱 **App-Level Protections Added:**

- ✅ **Single map load per session** (prevents multiple API calls)
- ✅ **Error handling** for API failures
- ✅ **Fallback interface** if maps fail
- ✅ **Rate limiting** built into the code
