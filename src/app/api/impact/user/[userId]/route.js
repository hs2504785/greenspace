import { supabase } from '@/lib/supabase';

// GET /api/impact/user/[userId] - Get specific user's impact profile
export async function GET(request, { params }) {
  try {
    const { userId } = params;

    // Get user impact profile
    const { data: profile, error: profileError } = await supabase
      .from('user_impact_profiles')
      .select(`
        *,
        user:users!user_impact_profiles_user_id_fkey (
          id,
          name,
          email,
          avatar_url,
          location,
          role,
          created_at
        )
      `)
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user impact profile:', profileError);
      
      // If profile doesn't exist, create it
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_impact_profiles')
          .insert({ user_id: userId })
          .select(`
            *,
            user:users!user_impact_profiles_user_id_fkey (
              id,
              name,
              email,
              avatar_url,
              location,
              role,
              created_at
            )
          `)
          .single();

        if (createError) {
          throw createError;
        }

        return Response.json({
          profile: newProfile,
          activities: [],
          achievements: [],
        });
      }
      
      throw profileError;
    }

    // Get user's recent activities
    const { data: activities, error: activitiesError } = await supabase
      .from('impact_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (activitiesError) {
      console.error('Error fetching user activities:', activitiesError);
      throw activitiesError;
    }

    // Calculate achievements based on profile data
    const achievements = calculateAchievements(profile);

    return Response.json({
      profile,
      activities: activities || [],
      achievements,
    });
  } catch (error) {
    console.error('Error in user impact API:', error);
    return Response.json(
      {
        error: 'Failed to fetch user impact profile',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate achievements
function calculateAchievements(profile) {
  const achievements = [];

  // Carbon Credits Achievements
  if (profile.carbon_credits_earned >= 100) {
    achievements.push({
      id: 'carbon-100',
      name: 'Carbon Warrior',
      description: 'Earned 100+ kg CO2 credits',
      icon: '🌍',
      category: 'environmental',
    });
  }
  if (profile.carbon_credits_earned >= 500) {
    achievements.push({
      id: 'carbon-500',
      name: 'Climate Hero',
      description: 'Earned 500+ kg CO2 credits',
      icon: '🌟',
      category: 'environmental',
    });
  }

  // Trees Planted Achievements
  if (profile.trees_planted >= 10) {
    achievements.push({
      id: 'trees-10',
      name: 'Tree Planter',
      description: 'Planted 10+ trees',
      icon: '🌲',
      category: 'environmental',
    });
  }
  if (profile.trees_planted >= 50) {
    achievements.push({
      id: 'trees-50',
      name: 'Forest Builder',
      description: 'Planted 50+ trees',
      icon: '🌳',
      category: 'environmental',
    });
  }

  // Seeds Shared Achievements
  if (profile.seeds_shared >= 5) {
    achievements.push({
      id: 'seeds-5',
      name: 'Seed Keeper',
      description: 'Shared 5+ seed varieties',
      icon: '🌱',
      category: 'community',
    });
  }
  if (profile.seeds_shared >= 20) {
    achievements.push({
      id: 'seeds-20',
      name: 'Biodiversity Champion',
      description: 'Shared 20+ seed varieties',
      icon: '🎖️',
      category: 'community',
    });
  }

  // Products Sold Achievements
  if (profile.products_sold >= 10) {
    achievements.push({
      id: 'sales-10',
      name: 'Local Producer',
      description: 'Sold 10+ products',
      icon: '🥬',
      category: 'commerce',
    });
  }
  if (profile.products_sold >= 100) {
    achievements.push({
      id: 'sales-100',
      name: 'Master Farmer',
      description: 'Sold 100+ products',
      icon: '🏆',
      category: 'commerce',
    });
  }

  // Events Achievements
  if (profile.events_organized >= 3) {
    achievements.push({
      id: 'events-3',
      name: 'Community Organizer',
      description: 'Organized 3+ events',
      icon: '📅',
      category: 'community',
    });
  }

  // Knowledge Sharing Achievements
  if (profile.guides_written >= 1) {
    achievements.push({
      id: 'guide-1',
      name: 'Knowledge Sharer',
      description: 'Written a guide',
      icon: '📚',
      category: 'knowledge',
    });
  }
  if (profile.workshops_conducted >= 1) {
    achievements.push({
      id: 'workshop-1',
      name: 'Educator',
      description: 'Conducted a workshop',
      icon: '🎓',
      category: 'knowledge',
    });
  }

  // Volunteer Hours Achievements
  if (profile.volunteer_hours >= 10) {
    achievements.push({
      id: 'volunteer-10',
      name: 'Dedicated Volunteer',
      description: '10+ volunteer hours',
      icon: '❤️',
      category: 'community',
    });
  }

  // Impact Level Achievements
  if (profile.impact_level === 'Environmental Champion') {
    achievements.push({
      id: 'champion',
      name: 'Environmental Champion',
      description: 'Reached highest impact level',
      icon: '👑',
      category: 'milestone',
    });
  }

  return achievements;
}

