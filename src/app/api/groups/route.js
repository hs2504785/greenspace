import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch all groups with filters
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const location = searchParams.get('location');
  const search = searchParams.get('search');
  const userId = searchParams.get('userId'); // Get user's groups
  const status = searchParams.get('status') || 'active';
  
  try {
    console.log('🌾 Fetching groups with filters:', {
      location,
      search,
      userId,
      status
    });

    let query = supabase
      .from('farming_groups')
      .select(`
        *,
        creator:created_by (
          id,
          name,
          avatar_url,
          location
        )
      `)
      .eq('status', status);

    // Filter by location
    if (location && location !== 'all') {
      query = query.ilike('location', `%${location}%`);
    }

    // Search by name or description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    // Filter by user's groups
    if (userId) {
      const { data: memberships } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      const groupIds = memberships?.map(m => m.group_id) || [];
      
      if (groupIds.length > 0) {
        query = query.in('id', groupIds);
      } else {
        // User has no groups, return empty array
        return NextResponse.json([]);
      }
    }

    // Order by member count (most active first)
    query = query.order('member_count', { ascending: false });

    const { data: groups, error } = await query;

    if (error) {
      console.error('❌ Error fetching groups:', error);
      throw error;
    }

    console.log(`✅ Fetched ${groups?.length || 0} groups`);
    return NextResponse.json(groups || []);

  } catch (error) {
    console.error('❌ Error in groups GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST - Create a new group
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🌾 Creating group for user:', userId);

    const body = await request.json();

    // Generate slug from name
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const { data: existingGroup } = await supabase
      .from('farming_groups')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingGroup) {
      return NextResponse.json(
        { error: 'A group with this name already exists. Please choose a different name.' },
        { status: 400 }
      );
    }

    const groupData = {
      name: body.name,
      slug: slug,
      description: body.description || null,
      location: body.location,
      state: body.state || null,
      coordinates: body.coordinates || null,
      cover_image: body.cover_image || null,
      group_type: body.group_type || 'location-based',
      privacy: body.privacy || 'public',
      max_members: body.max_members || 0,
      auto_approve_members: body.auto_approve_members !== undefined ? body.auto_approve_members : true,
      allow_member_posts: body.allow_member_posts !== undefined ? body.allow_member_posts : true,
      allow_events: body.allow_events !== undefined ? body.allow_events : true,
      created_by: userId,
      status: 'active'
    };

    console.log('📝 Group data prepared:', groupData);

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('farming_groups')
      .insert(groupData)
      .select(`
        *,
        creator:created_by (
          id,
          name,
          avatar_url,
          location
        )
      `)
      .single();

    if (groupError) {
      console.error('❌ Error creating group:', groupError);
      throw groupError;
    }

    // Automatically add creator as admin member
    const { error: membershipError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin',
        status: 'active'
      });

    if (membershipError) {
      console.error('❌ Error creating membership:', membershipError);
      // Don't fail the group creation, just log the error
    }

    console.log('✅ Group created successfully:', group.id);
    return NextResponse.json(group);

  } catch (error) {
    console.error('❌ Error in groups POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create group' },
      { status: 500 }
    );
  }
}

