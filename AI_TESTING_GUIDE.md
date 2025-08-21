# 🧪 AI Chat Assistant Testing Guide

## 🚀 Quick Testing Steps

### 1. **Environment Setup** ✅

- [x] Dependencies installed
- [x] API route created
- [x] Component created
- [x] Integrated into layout
- [ ] **YOU NEED TO**: Add your Google AI API key to `.env.local`

### 2. **Get Your FREE API Key**

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `.env.local`:
   ```
   GOOGLE_AI_API_KEY=your_actual_api_key_here
   ```

### 3. **Test the Chat Assistant**

#### **Visual Test:**

- Look for the green 🤖 button in bottom-right corner
- Should appear on all pages when `NEXT_PUBLIC_AI_CHAT_ENABLED=true`

#### **Interaction Test:**

- Click the 🤖 button to open chat
- Should see welcome message from AI
- Try quick action buttons:
  - "💳 How to pay with UPI?"
  - "🥬 What vegetables are in season?"
  - "📦 How to track my order?"
  - "🌱 Farming tips for beginners"

#### **Chat Test:**

- Type questions in the input field:
  - "How do I pay with GPay?"
  - "What vegetables are good to plant now?"
  - "How to track my order?"
  - "What's the best organic fertilizer?"

### 4. **Expected Responses**

The AI should give helpful responses about:

- **Payment**: UPI, GPay, PhonePe, QR codes, screenshots
- **Vegetables**: Seasonal recommendations, local produce
- **Orders**: Tracking, status, general process
- **Farming**: Organic tips, seasonal planting, pest control

### 5. **Troubleshooting**

#### **If chat button doesn't appear:**

- Check `.env.local` has `NEXT_PUBLIC_AI_CHAT_ENABLED=true`
- Restart development server after adding environment variables

#### **If API errors occur:**

- Check `GOOGLE_AI_API_KEY` is correct in `.env.local`
- Verify you're using the free Google AI key
- Check browser console for error messages

#### **If responses are slow:**

- Normal for first request (cold start)
- Subsequent requests should be faster
- Free tier has rate limits (15/minute)

### 6. **Feature Verification Checklist**

- [ ] Chat button appears in bottom-right
- [ ] Chat window opens when clicked
- [ ] Welcome message displays
- [ ] Quick action buttons work
- [ ] Can type custom messages
- [ ] AI responds with relevant information
- [ ] Can close chat window
- [ ] Works on mobile (responsive)
- [ ] No console errors

### 7. **Test Scenarios**

#### **Payment Help:**

- "How do I pay?"
- "What is UPI?"
- "GPay not working"
- "Payment screenshot upload"

#### **Vegetable Questions:**

- "What vegetables are in season?"
- "Best vegetables to grow now"
- "Organic vegetables available"
- "Local produce recommendations"

#### **Order Support:**

- "How to track order"
- "Order status meaning"
- "Guest checkout process"
- "Delivery information"

#### **Farming Advice:**

- "Organic farming tips"
- "Pest control methods"
- "When to plant tomatoes"
- "Best soil preparation"

### 8. **Performance Testing**

#### **Free Tier Limits:**

- **15 requests/minute**: Test rapid-fire questions
- **1,500 requests/day**: Plenty for development
- **1M tokens/month**: ~2000 full conversations

#### **Response Quality:**

- Responses should be under 200 words
- Include relevant emojis
- Focus on Indian context
- Mention UPI payment options
- Provide practical farming advice

### 9. **Success Metrics**

Your AI implementation is successful if:

- ✅ Users can get instant help with common questions
- ✅ Payment process is clearly explained
- ✅ Seasonal vegetable recommendations work
- ✅ Farming advice is practical and relevant
- ✅ No technical errors or crashes
- ✅ Mobile experience is smooth

### 10. **Next Steps After Testing**

Once basic chat works:

1. Test with real users for feedback
2. Monitor usage and popular questions
3. Add more specific farming knowledge
4. Integrate with your order system data
5. Add seasonal vegetable database
6. Consider upgrading to paid AI for higher limits

## 🎉 Ready to Test!

Your AI chat assistant is ready! Open your browser, go to http://localhost:3000, and look for the 🤖 button in the bottom-right corner.

**Remember**: Add your Google AI API key to `.env.local` first!
