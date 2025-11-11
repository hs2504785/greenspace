# Community Impact Dashboard - Setup Guide

## 🌍 Overview

The Community Impact Dashboard is a comprehensive system that tracks and displays environmental and community contributions from all members. It includes:

- **Carbon Credit Scoring** - Track CO₂ saved through local food purchases and sustainable practices
- **Impact Leaderboard** - Showcase top contributors with rankings
- **Individual Impact Profiles** - Detailed view of each member's contributions
- **Activity Tracking** - Log and display all impact-generating activities
- **Achievement System** - Unlock badges based on contributions
- **Community Statistics** - Aggregate metrics showing collective impact

## 📋 Features

### Impact Metrics Tracked

1. **Environmental Impact**
   - Carbon credits earned (kg CO₂)
   - Trees planted
   - Organic waste composted
   - Water saved
   - Plastic reduced
   - Local food purchased

2. **Community Contributions**
   - Products sold/purchased
   - Seeds shared/received
   - Events organized/attended
   - Posts and helpful comments
   - Farm visits hosted/attended

3. **Knowledge Sharing**
   - Guides written
   - Questions answered
   - Workshops conducted

4. **Other Contributions**
   - Volunteer hours
   - Donations made
   - Members referred

### Impact Levels

Members are automatically assigned impact levels based on their total score:

- 🏆 **Environmental Champion** (10,000+ points) - Highest level achievers
- ⭐ **Sustainability Leader** (5,000+ points) - Active community leaders
- 🎖️ **Green Warrior** (2,000+ points) - Dedicated contributors
- 💚 **Eco Contributor** (500+ points) - Regular participants
- 🌱 **Green Starter** (0-499 points) - New members starting their journey

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Execute the SQL migration file to create all necessary tables and functions:

```bash
# Using Supabase CLI
supabase db reset
supabase db push

# Or manually run in Supabase SQL Editor:
# database/create-community-impact-system.sql
```

This creates:
- `user_impact_profiles` - Stores impact data for each user
- `impact_activities` - Logs all impact-generating activities
- Views: `community_impact_stats`, `monthly_impact_leaderboard`, `top_impact_contributors`
- Triggers: Auto-update impact scores from orders and seed exchanges
- Functions: Impact tracking and ranking updates

### Step 2: Initialize Existing Users

The migration automatically creates impact profiles for all existing users. To verify:

```sql
SELECT COUNT(*) FROM user_impact_profiles;
```

### Step 3: Set Up Automated Tracking

The system automatically tracks:
- ✅ Product sales (when orders are completed)
- ✅ Seed exchanges (when marked as completed)
- Manual activities can be logged through API

### Step 4: Access the Dashboard

Navigate to:
- **Community Dashboard**: `http://localhost:3000/impact`
- **Individual Profile**: `http://localhost:3000/impact/user/[userId]`

### Step 5: Add Navigation Links

Add the Impact Dashboard to your main navigation:

```javascript
// In your Header/Navigation component
<Nav.Link href="/impact">
  <FaLeaf className="me-2" />
  Community Impact
</Nav.Link>
```

## 📊 API Endpoints

### 1. Get Community Statistics
```
GET /api/impact/stats
```

Returns:
- Community-wide impact metrics
- Recent activities
- Growth statistics

### 2. Get Leaderboard
```
GET /api/impact/leaderboard?period=all-time&limit=100
```

Parameters:
- `period`: "all-time" or "monthly"
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset

Returns:
- Ranked list of top contributors
- User details and impact scores

### 3. Get User Impact Profile
```
GET /api/impact/user/[userId]
```

Returns:
- Detailed impact profile
- Recent activities
- Unlocked achievements

## 🔧 Manual Activity Logging

To manually log impact activities (for admin or special cases):

```javascript
// Example: Log tree planting activity
await fetch('/api/impact/activities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-uuid',
    activity_type: 'tree_planted',
    activity_category: 'environmental',
    description: 'Planted 5 fruit trees',
    quantity: 5,
    unit: 'trees',
    carbon_credits: 12.5,  // ~2.5 kg CO₂ per tree per year
    points: 250
  })
});
```

## 🎯 Scoring System

### Point Values

**Environmental Activities:**
- Plant tree: 50 points + 2.5 kg CO₂ credits
- Compost organic waste: 2 points per kg
- Save water: 0.1 points per liter
- Reduce plastic: 20 points per kg
- Buy local food: 3 points per kg + CO₂ credits

**Commerce Activities:**
- Sell product: 15 points per item
- Purchase product: 5 points per item

**Community Activities:**
- Share seeds: 25 points per variety
- Receive seeds: 10 points
- Organize event: 50 points
- Attend event: 20 points
- Host farm visit: 30 points
- Attend farm visit: 15 points
- Create post: 10 points
- Helpful comment: 5 points

**Knowledge Sharing:**
- Write guide: 100 points
- Answer question: 15 points
- Conduct workshop: 75 points

**Other Contributions:**
- Volunteer hour: 20 points per hour
- Donation: 0.5 points per rupee
- Refer member: 40 points

### Carbon Credit Calculation

Carbon credits are estimated based on:
- **Local food purchases**: 2.5 kg CO₂ saved per kg (vs. store-bought)
- **Trees planted**: ~2.5 kg CO₂ absorbed per tree per year
- **Composting**: Reduces methane emissions from landfills
- **Water conservation**: Reduces energy for water treatment
- **Plastic reduction**: Reduces manufacturing and disposal emissions

## 🎖️ Achievement System

Achievements are automatically unlocked based on milestones:

### Environmental Achievements
- 🌍 Carbon Warrior: 100+ kg CO₂ credits
- 🌟 Climate Hero: 500+ kg CO₂ credits
- 🌲 Tree Planter: 10+ trees
- 🌳 Forest Builder: 50+ trees

### Community Achievements
- 🌱 Seed Keeper: 5+ seed varieties shared
- 🎖️ Biodiversity Champion: 20+ seed varieties
- 📅 Community Organizer: 3+ events organized
- ❤️ Dedicated Volunteer: 10+ hours

### Commerce Achievements
- 🥬 Local Producer: 10+ products sold
- 🏆 Master Farmer: 100+ products sold

### Knowledge Achievements
- 📚 Knowledge Sharer: 1+ guide written
- 🎓 Educator: 1+ workshop conducted

### Milestone Achievements
- 👑 Environmental Champion: Highest impact level reached

## 🔄 Maintenance Tasks

### Update Rankings (Run Periodically)

```sql
-- Update all user rankings
SELECT update_impact_rankings();
```

### Reset Monthly Stats (Run on 1st of Month)

```sql
-- Reset monthly counters
SELECT reset_monthly_impact_stats();
```

### Refresh Community Stats (Run Daily)

```sql
-- Manual refresh of materialized view
SELECT refresh_community_impact_stats();
```

## 📱 User Experience

### For Regular Members

1. **View Community Impact**: See collective achievements
2. **Check Leaderboard**: Compare contributions with others
3. **Track Personal Progress**: View individual impact profile
4. **Unlock Achievements**: Work towards badges and milestones
5. **See Recent Activities**: Monitor community engagement

### For Sellers

1. **Automatic Tracking**: Sales automatically generate impact points
2. **Enhanced Profile**: Show environmental contribution to buyers
3. **Competitive Ranking**: Showcase position in community
4. **Carbon Credits**: Display CO₂ saved through local sales

### For Admins

1. **Community Overview**: Monitor overall health and engagement
2. **Member Insights**: Identify top contributors
3. **Manual Adjustments**: Log special activities or corrections
4. **Growth Tracking**: View trends over time

## 🎨 UI Components

### Dashboard Page (`/impact`)
- Community statistics cards
- Environmental impact breakdown
- Impact level distribution
- Top contributors leaderboard
- Recent activities feed
- All-time and monthly views

### User Profile Page (`/impact/user/[userId]`)
- User header with impact level badge
- Key metrics (CO₂, trees, seeds, hours)
- Detailed impact breakdown
- Unlocked achievements grid
- Recent activities table
- Knowledge sharing stats

## 🔐 Security & Permissions

### Row Level Security (RLS)

- **user_impact_profiles**: 
  - Anyone can view
  - Users can only update their own profile

- **impact_activities**:
  - Anyone can view
  - Users can only insert their own activities

### Admin Functions

Admins can manually:
- Log activities for any user
- Adjust scores (through direct DB access)
- Verify activities
- Grant special badges

## 🚦 Testing

### Test the Dashboard

1. Navigate to `http://localhost:3000/impact`
2. Verify community stats display
3. Check leaderboard shows users
4. Click on a user to view profile

### Test Activity Tracking

1. Complete an order
2. Check user's impact profile
3. Verify points and CO₂ credits updated
4. See activity in recent activities feed

### Test Achievements

1. Log various activities for a test user
2. Check achievements unlock at milestones
3. Verify badges display on profile

## 🎉 Next Steps

1. **Add to Navigation**: Link to `/impact` from main menu
2. **User Onboarding**: Explain impact tracking to new users
3. **Monthly Reports**: Send emails with member's monthly impact
4. **Gamification**: Add competitions and challenges
5. **Social Sharing**: Allow users to share achievements
6. **Mobile App**: Create mobile version of dashboard
7. **Data Export**: Allow users to download their impact report
8. **Integration**: Connect with existing features (farm visits, groups, etc.)

## 📚 Related Files

- Database Schema: `/database/create-community-impact-system.sql`
- API Routes:
  - `/src/app/api/impact/stats/route.js`
  - `/src/app/api/impact/leaderboard/route.js`
  - `/src/app/api/impact/user/[userId]/route.js`
- UI Pages:
  - `/src/app/impact/page.js`
  - `/src/app/impact/user/[userId]/page.js`
- Styles: `/src/styles/main.scss`

## 🐛 Troubleshooting

### Issue: Dashboard shows "Not Yet Activated"
**Solution**: Run the database migration first

### Issue: No data showing
**Solution**: 
- Check if user_impact_profiles table has records
- Run: `INSERT INTO user_impact_profiles (user_id) SELECT id FROM users ON CONFLICT DO NOTHING;`

### Issue: Rankings not updating
**Solution**: Run `SELECT update_impact_rankings();`

### Issue: Activity not tracked
**Solution**: 
- Verify triggers are active
- Check if orders/seed_exchanges tables exist
- Manually log activity if needed

## 📞 Support

For issues or questions:
1. Check database logs for errors
2. Verify API responses in browser console
3. Review SQL migration completion
4. Check Supabase dashboard for table structure

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Author**: Arya Natural Farms Development Team

