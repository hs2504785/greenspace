/**
 * Test script for Community Impact Dashboard
 * Tests the API endpoints and verifies data structure
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testImpactSystem() {
  console.log('🌍 Testing Community Impact Dashboard System...\n');

  try {
    // Test 1: Community Stats
    console.log('📊 Test 1: Fetching community statistics...');
    const statsResponse = await fetch(`${BASE_URL}/api/impact/stats`);
    
    if (!statsResponse.ok) {
      throw new Error(`Stats API failed: ${statsResponse.status}`);
    }
    
    const statsData = await statsResponse.json();
    console.log('✅ Community Stats Retrieved:');
    console.log(`   - Active Members: ${statsData.stats.total_active_members}`);
    console.log(`   - Carbon Credits: ${statsData.stats.total_carbon_credits} kg CO₂`);
    console.log(`   - Trees Planted: ${statsData.stats.total_trees_planted}`);
    console.log(`   - Seeds Shared: ${statsData.stats.total_seeds_shared}`);
    console.log(`   - Recent Activities: ${statsData.recentActivities.length}`);
    console.log('');

    // Test 2: All-Time Leaderboard
    console.log('🏆 Test 2: Fetching all-time leaderboard...');
    const leaderboardResponse = await fetch(`${BASE_URL}/api/impact/leaderboard?period=all-time&limit=10`);
    
    if (!leaderboardResponse.ok) {
      throw new Error(`Leaderboard API failed: ${leaderboardResponse.status}`);
    }
    
    const leaderboardData = await leaderboardResponse.json();
    console.log('✅ Leaderboard Retrieved:');
    console.log(`   - Total Leaders: ${leaderboardData.count}`);
    if (leaderboardData.leaderboard.length > 0) {
      console.log(`   - Top Contributor: ${leaderboardData.leaderboard[0].name}`);
      console.log(`   - Top Score: ${leaderboardData.leaderboard[0].total_impact_score}`);
    }
    console.log('');

    // Test 3: Monthly Leaderboard
    console.log('📅 Test 3: Fetching monthly leaderboard...');
    const monthlyResponse = await fetch(`${BASE_URL}/api/impact/leaderboard?period=monthly&limit=10`);
    
    if (!monthlyResponse.ok) {
      throw new Error(`Monthly leaderboard API failed: ${monthlyResponse.status}`);
    }
    
    const monthlyData = await monthlyResponse.json();
    console.log('✅ Monthly Leaderboard Retrieved:');
    console.log(`   - Active This Month: ${monthlyData.count}`);
    console.log('');

    // Test 4: User Profile (if leaderboard has users)
    if (leaderboardData.leaderboard.length > 0) {
      const testUserId = leaderboardData.leaderboard[0].user_id;
      console.log(`👤 Test 4: Fetching user impact profile for ${testUserId}...`);
      
      const userResponse = await fetch(`${BASE_URL}/api/impact/user/${testUserId}`);
      
      if (!userResponse.ok) {
        throw new Error(`User profile API failed: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      console.log('✅ User Profile Retrieved:');
      console.log(`   - Name: ${userData.profile.user?.name}`);
      console.log(`   - Impact Level: ${userData.profile.impact_level}`);
      console.log(`   - Total Score: ${userData.profile.total_impact_score}`);
      console.log(`   - Carbon Credits: ${userData.profile.carbon_credits_earned} kg`);
      console.log(`   - Activities Logged: ${userData.activities.length}`);
      console.log(`   - Achievements Unlocked: ${userData.achievements.length}`);
      console.log('');
    }

    // Summary
    console.log('✨ All Tests Passed Successfully!\n');
    console.log('📍 Access the dashboard at:');
    console.log(`   - Community Dashboard: ${BASE_URL}/impact`);
    console.log(`   - User Profile: ${BASE_URL}/impact/user/[userId]`);
    console.log('');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure the database migration has been run');
    console.log('   2. Ensure the Next.js dev server is running');
    console.log('   3. Check that user_impact_profiles table exists');
    console.log('   4. Verify Supabase connection is working');
    console.log('');
    console.log('📄 Setup Guide: COMMUNITY_IMPACT_DASHBOARD_GUIDE.md');
    process.exit(1);
  }
}

// Run tests
testImpactSystem();

