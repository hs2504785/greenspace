/**
 * Sample script to populate some test impact data
 * This helps visualize the dashboard with realistic data
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function populateSampleData() {
  console.log('🌱 Populating sample impact data...\n');

  try {
    // Get first 5 users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .limit(5);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      console.log('⚠️  No users found. Please create some users first.');
      return;
    }

    console.log(`Found ${users.length} users to add sample data for\n`);

    // Sample activities for each user
    const activities = [
      {
        activity_type: 'tree_planted',
        activity_category: 'environmental',
        description: 'Planted mango trees in backyard',
        quantity: 5,
        unit: 'trees',
        carbon_credits: 12.5,
        points: 250
      },
      {
        activity_type: 'seed_shared',
        activity_category: 'community',
        description: 'Shared heirloom tomato seeds',
        quantity: 1,
        unit: 'variety',
        carbon_credits: 2,
        points: 25
      },
      {
        activity_type: 'composted_waste',
        activity_category: 'environmental',
        description: 'Composted organic kitchen waste',
        quantity: 10,
        unit: 'kg',
        carbon_credits: 5,
        points: 20
      },
      {
        activity_type: 'water_saved',
        activity_category: 'environmental',
        description: 'Rainwater harvesting',
        quantity: 500,
        unit: 'liters',
        carbon_credits: 1.5,
        points: 50
      },
      {
        activity_type: 'plastic_reduced',
        activity_category: 'environmental',
        description: 'Switched to reusable bags',
        quantity: 2,
        unit: 'kg',
        carbon_credits: 8,
        points: 40
      },
      {
        activity_type: 'workshop_conducted',
        activity_category: 'knowledge',
        description: 'Conducted organic farming workshop',
        quantity: 1,
        unit: 'workshop',
        carbon_credits: 5,
        points: 75
      },
      {
        activity_type: 'volunteer_work',
        activity_category: 'community',
        description: 'Volunteered at community garden',
        quantity: 4,
        unit: 'hours',
        carbon_credits: 2,
        points: 80
      }
    ];

    // Add random activities for each user
    for (const user of users) {
      console.log(`Adding activities for ${user.name}...`);
      
      // Randomly select 3-5 activities for this user
      const numActivities = Math.floor(Math.random() * 3) + 3;
      const selectedActivities = [];
      
      for (let i = 0; i < numActivities; i++) {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        selectedActivities.push({
          user_id: user.id,
          ...activity,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Insert activities
      const { error: activityError } = await supabase
        .from('impact_activities')
        .insert(selectedActivities);

      if (activityError) {
        console.error(`   ❌ Error for ${user.name}:`, activityError.message);
      } else {
        console.log(`   ✅ Added ${numActivities} activities for ${user.name}`);
      }

      // Update user impact profile
      const totalCredits = selectedActivities.reduce((sum, a) => sum + a.carbon_credits, 0);
      const totalPoints = selectedActivities.reduce((sum, a) => sum + a.points, 0);

      // Random additional impacts
      const { error: updateError } = await supabase
        .from('user_impact_profiles')
        .update({
          carbon_credits_earned: totalCredits,
          trees_planted: Math.floor(Math.random() * 10) + 1,
          seeds_shared: Math.floor(Math.random() * 5),
          products_sold: Math.floor(Math.random() * 20),
          products_purchased: Math.floor(Math.random() * 15),
          events_attended: Math.floor(Math.random() * 5),
          volunteer_hours: Math.floor(Math.random() * 20),
          organic_waste_composted_kg: Math.floor(Math.random() * 50) + 10,
          water_saved_liters: Math.floor(Math.random() * 1000) + 100,
          plastic_reduced_kg: Math.floor(Math.random() * 10) + 1,
          local_food_purchased_kg: Math.floor(Math.random() * 100) + 20,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`   ❌ Error updating profile for ${user.name}:`, updateError.message);
      }
    }

    console.log('\n✨ Sample data populated successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Update rankings: SELECT update_impact_rankings();');
    console.log('   2. Visit http://localhost:3000/impact to see the dashboard');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

populateSampleData();

