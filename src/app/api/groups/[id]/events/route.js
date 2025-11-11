import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch group events
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'upcoming';
    const type = searchParams.get('type');

    console.log('🌾 Fetching events for group:', id);

    let query = supabase
      .from('group_events')
      .select(`
        *,
        creator:created_by (
          id,
          name,
          avatar_url
        )
      `)
      .eq('group_id', id);

    // Filter by status
    if (status === 'upcoming') {
      query = query
        .gte('start_date', new Date().toISOString())
        .eq('status', 'upcoming')
        .order('start_date', { ascending: true });
    } else if (status === 'past') {
      query = query
        .lt('start_date', new Date().toISOString())
        .order('start_date', { ascending: false });
    } else {
      query = query
        .eq('status', status)
        .order('start_date', { ascending: true });
    }

    // Filter by event type
    if (type) {
      query = query.eq('event_type', type);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }

    console.log(`✅ Fetched ${events?.length || 0} events`);
    return NextResponse.json(events || []);

  } catch (error) {
    console.error('❌ Error in events GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Create a new event
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🌾 Creating event in group:', id);

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_memberships')
      .select('id, role')
      .eq('group_id', id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to create events' },
        { status: 403 }
      );
    }

    // Check group settings
    const { data: group } = await supabase
      .from('farming_groups')
      .select('allow_events')
      .eq('id', id)
      .single();

    if (!group?.allow_events) {
      return NextResponse.json(
        { error: 'Events are not enabled for this group' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const eventData = {
      group_id: id,
      created_by: userId,
      title: body.title,
      description: body.description || null,
      event_type: body.event_type || 'meetup',
      start_date: body.start_date,
      end_date: body.end_date || null,
      is_all_day: body.is_all_day || false,
      location_name: body.location_name || null,
      location_address: body.location_address || null,
      coordinates: body.coordinates || null,
      is_online: body.is_online || false,
      online_link: body.online_link || null,
      max_attendees: body.max_attendees || 0,
      cover_image: body.cover_image || null,
      images: body.images || [],
      require_approval: body.require_approval || false,
      is_public: body.is_public !== undefined ? body.is_public : true,
      status: 'upcoming'
    };

    const { data: event, error: eventError } = await supabase
      .from('group_events')
      .insert(eventData)
      .select(`
        *,
        creator:created_by (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (eventError) {
      console.error('❌ Error creating event:', eventError);
      throw eventError;
    }

    // Automatically add creator as attendee
    await supabase
      .from('event_attendees')
      .insert({
        event_id: event.id,
        user_id: userId,
        rsvp_status: 'going'
      });

    console.log('✅ Event created successfully');
    return NextResponse.json(event);

  } catch (error) {
    console.error('❌ Error in events POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}

