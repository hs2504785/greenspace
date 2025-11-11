import { supabase } from '@/lib/supabase';

// GET /api/impact/stats - Get community-wide impact statistics
export async function GET(request) {
  try {
    // Get community impact stats
    const { data: stats, error: statsError } = await supabase
      .from('community_impact_stats')
      .select('*')
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching community stats:', statsError);
      throw statsError;
    }

    // Get recent activities
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('impact_activities')
      .select(`
        *,
        user:users!impact_activities_user_id_fkey (
          id,
          name,
          avatar_url,
          location
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activitiesError) {
      console.error('Error fetching recent activities:', activitiesError);
      throw activitiesError;
    }

    // Calculate growth (mock data for now, can be enhanced with historical data)
    const growthData = {
      carbonCreditsGrowth: stats?.total_carbon_credits > 0 ? 12.5 : 0,
      membersGrowth: stats?.total_active_members > 0 ? 8.3 : 0,
      treesGrowth: stats?.total_trees_planted > 0 ? 15.7 : 0,
    };

    return Response.json({
      stats: stats || {
        total_active_members: 0,
        total_carbon_credits: 0,
        total_trees_planted: 0,
        total_waste_composted: 0,
        total_water_saved: 0,
        total_plastic_reduced: 0,
        total_local_food: 0,
        total_products_sold: 0,
        total_seeds_shared: 0,
        total_events_organized: 0,
        total_volunteer_hours: 0,
        total_guides: 0,
        total_workshops: 0,
        champions_count: 0,
        leaders_count: 0,
        warriors_count: 0,
        contributors_count: 0,
        starters_count: 0,
        last_updated: new Date().toISOString(),
      },
      recentActivities: recentActivities || [],
      growth: growthData,
    });
  } catch (error) {
    console.error('Error in impact stats API:', error);
    return Response.json(
      {
        error: 'Failed to fetch impact statistics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

