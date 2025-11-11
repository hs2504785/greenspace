import { supabase } from '@/lib/supabase';

// GET /api/impact/leaderboard - Get top contributors leaderboard
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all-time'; // 'all-time' or 'monthly'
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let data, error;

    if (period === 'monthly') {
      // Get monthly leaderboard
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_impact_leaderboard')
        .select('*')
        .range(offset, offset + limit - 1);

      data = monthlyData;
      error = monthlyError;
    } else {
      // Get all-time leaderboard
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('top_impact_contributors')
        .select('*')
        .range(offset, offset + limit - 1);

      data = allTimeData;
      error = allTimeError;
    }

    if (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }

    return Response.json({
      leaderboard: data || [],
      period,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return Response.json(
      {
        error: 'Failed to fetch leaderboard',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

