import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST - Auto-create groups based on user locations
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow super admins to run this
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can auto-create groups' },
        { status: 403 }
      );
    }

    console.log('🌾 Auto-creating groups from user locations...');

    // Get unique locations from users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('location')
      .not('location', 'is', null)
      .neq('location', '');

    if (usersError) {
      throw usersError;
    }

    // Get unique locations
    const locationCounts = {};
    users.forEach(user => {
      if (user.location) {
        const cleanLocation = user.location.trim();
        locationCounts[cleanLocation] = (locationCounts[cleanLocation] || 0) + 1;
      }
    });

    console.log('📍 Found locations:', Object.keys(locationCounts).length);

    // Get existing groups to avoid duplicates
    const { data: existingGroups } = await supabase
      .from('farming_groups')
      .select('location');

    const existingLocations = new Set(
      existingGroups?.map(g => g.location.toLowerCase().trim()) || []
    );

    const groupsToCreate = [];
    const createdGroups = [];

    for (const [location, count] of Object.entries(locationCounts)) {
      // Only create if location doesn't exist and has at least 2 users
      if (count >= 2 && !existingLocations.has(location.toLowerCase())) {
        const slug = location
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Get a user from this location to be the creator
        const { data: locationUser } = await supabase
          .from('users')
          .select('id')
          .eq('location', location)
          .limit(1)
          .single();

        if (locationUser) {
          groupsToCreate.push({
            name: `${location} Natural Farmers`,
            slug: `${slug}-farmers`,
            description: `Connect with natural farming enthusiasts and local farmers in ${location}. Share knowledge, seeds, and experiences with your local community.`,
            location: location,
            created_by: locationUser.id,
            group_type: 'location-based',
            privacy: 'public',
            auto_approve_members: true,
            allow_member_posts: true,
            allow_events: true,
            status: 'active'
          });
        }
      }
    }

    console.log(`📝 Creating ${groupsToCreate.length} new groups...`);

    // Insert groups in batches
    if (groupsToCreate.length > 0) {
      const { data: newGroups, error: insertError } = await supabase
        .from('farming_groups')
        .insert(groupsToCreate)
        .select();

      if (insertError) {
        console.error('❌ Error inserting groups:', insertError);
        throw insertError;
      }

      createdGroups.push(...(newGroups || []));

      // Auto-join users to their location groups
      console.log('👥 Auto-joining users to their location groups...');
      
      for (const group of newGroups || []) {
        // Get all users from this location
        const { data: locationUsers } = await supabase
          .from('users')
          .select('id')
          .eq('location', group.location);

        if (locationUsers && locationUsers.length > 0) {
          const memberships = locationUsers.map(user => ({
            group_id: group.id,
            user_id: user.id,
            role: user.id === group.created_by ? 'admin' : 'member',
            status: 'active'
          }));

          await supabase
            .from('group_memberships')
            .insert(memberships);
        }
      }
    }

    console.log(`✅ Created ${createdGroups.length} groups successfully`);

    return NextResponse.json({
      message: `Successfully created ${createdGroups.length} groups`,
      groups: createdGroups,
      locations_processed: Object.keys(locationCounts).length,
      users_with_locations: users.length
    });

  } catch (error) {
    console.error('❌ Error in auto-create groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-create groups' },
      { status: 500 }
    );
  }
}

