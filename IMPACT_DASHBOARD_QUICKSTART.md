# 🌍 Community Impact Dashboard - Quick Start

## ✨ What You Got

A **complete Community Impact Dashboard** with:

✅ Carbon credit scoring system  
✅ Member leaderboard (all-time & monthly)  
✅ Individual impact profiles  
✅ Automatic activity tracking  
✅ Achievement badges  
✅ Beautiful responsive UI  

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration (Required)

Open Supabase SQL Editor and run:

```
database/create-community-impact-system.sql
```

This creates all tables, views, triggers, and functions.

### Step 2: Access Your Dashboard

Visit these URLs:

- **Community Dashboard**: http://localhost:3000/impact
- **User Profile**: http://localhost:3000/impact/user/[userId]
- **All Users**: http://localhost:3000/users (click any user to see their impact)

Or click **"Community Impact"** in the navigation menu! 📊

### Step 3: Populate Sample Data (Optional)

Want to see it in action? Run:

```bash
node scripts/sample-impact-data.js
```

Then update rankings:

```sql
SELECT update_impact_rankings();
```

## 🎯 How It Works

### Automatic Tracking

The system **automatically tracks**:

- ✅ **Product Sales** → Carbon credits + points for buyer & seller
- ✅ **Seed Exchanges** → Community contribution points
- ✅ **Activities** → All logged in impact_activities table

### Manual Tracking (Coming Soon)

You can manually log:
- Tree planting 🌳
- Composting ♻️
- Workshops 🎓
- Volunteer hours ❤️

## 📊 What You'll See

### Dashboard Shows:
- Total CO₂ saved by community
- Trees planted
- Seeds shared
- Active members
- Top contributors leaderboard
- Recent activities feed

### User Profiles Show:
- Individual carbon credits
- Impact level badge
- Ranking position
- Detailed metrics
- Achievement badges
- Activity history

## 🏆 Impact Levels

Members earn badges based on total score:

- 👑 **Environmental Champion** - 10,000+ points
- ⭐ **Sustainability Leader** - 5,000+ points
- 🎖️ **Green Warrior** - 2,000+ points
- 💚 **Eco Contributor** - 500+ points
- 🌱 **Green Starter** - 0-499 points

## 📈 Scoring System

**Environmental Activities:**
- Plant tree: 50 pts + 2.5 kg CO₂
- Local food purchase: 3 pts/kg + CO₂ credits
- Compost: 2 pts/kg
- Save water: 0.1 pts/liter

**Community Activities:**
- Share seeds: 25 pts
- Organize event: 50 pts
- Attend event: 20 pts
- Volunteer hour: 20 pts

**Knowledge Sharing:**
- Write guide: 100 pts
- Conduct workshop: 75 pts
- Answer question: 15 pts

## 🔍 Check Current Status

View all user listings with impact:
http://localhost:3000/users

Click any user to see their listings, then navigate to their impact profile!

## 📚 Documentation

Full guides available:
- 📄 **Setup Guide**: `COMMUNITY_IMPACT_DASHBOARD_GUIDE.md`
- 📄 **Implementation Summary**: `IMPACT_DASHBOARD_IMPLEMENTATION_SUMMARY.md`

## 🎉 You're All Set!

The impact dashboard is now:
- ✅ Integrated in navigation
- ✅ Connected to your database
- ✅ Tracking orders & seed exchanges automatically
- ✅ Ready for users to explore

Just run the database migration and start using it! 🚀

---

**Need Help?** Check the troubleshooting section in `COMMUNITY_IMPACT_DASHBOARD_GUIDE.md`

