import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch exchange requests (for current user or specific seed)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const seedId = searchParams.get('seedId');
    const type = searchParams.get('type'); // 'sent' or 'received'
    
    console.log('🤝 Fetching exchange requests for user:', userId, { seedId, type });
    
    let query = supabase
      .from('seed_exchange_requests')
      .select(`
        *,
        seed:seed_id (
          id,
          name,
          variety,
          images,
          quantity_available,
          quantity_unit,
          user_id
        ),
        requester:requester_id (
          id,
          name,
          avatar_url,
          phone,
          location
        ),
        owner:owner_id (
          id,
          name,
          avatar_url,
          phone,
          location
        ),
        exchange_seed:exchange_seed_id (
          id,
          name,
          variety,
          images
        )
      `)
      .order('created_at', { ascending: false });
    
    // Filter based on type
    if (seedId) {
      query = query.eq('seed_id', seedId);
    } else if (type === 'sent') {
      query = query.eq('requester_id', userId);
    } else if (type === 'received') {
      query = query.eq('owner_id', userId);
    } else {
      // Get both sent and received
      query = query.or(`requester_id.eq.${userId},owner_id.eq.${userId}`);
    }
    
    const { data: requests, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching exchange requests:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${requests?.length || 0} exchange requests`);
    
    return NextResponse.json(requests || []);
  } catch (error) {
    console.error('❌ Error in exchange requests GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exchange requests' },
      { status: 500 }
    );
  }
}

// POST - Create new exchange request
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    
    console.log('🤝 Creating exchange request:', {
      seedId: body.seed_id,
      requestType: body.request_type,
      quantity: body.quantity_requested
    });
    
    // Get seed owner
    const { data: seed } = await supabase
      .from('seeds')
      .select('user_id, quantity_available')
      .eq('id', body.seed_id)
      .single();
    
    if (!seed) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 });
    }
    
    if (seed.user_id === userId) {
      return NextResponse.json(
        { error: 'Cannot request your own seeds' },
        { status: 400 }
      );
    }
    
    // Check if already requested
    const { data: existing } = await supabase
      .from('seed_exchange_requests')
      .select('id')
      .eq('seed_id', body.seed_id)
      .eq('requester_id', userId)
      .in('status', ['pending', 'accepted'])
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending request for this seed' },
        { status: 400 }
      );
    }
    
    const requestData = {
      seed_id: body.seed_id,
      requester_id: userId,
      owner_id: seed.user_id,
      request_type: body.request_type || 'free_claim',
      quantity_requested: body.quantity_requested || 1,
      message: body.message || null,
      exchange_seed_id: body.exchange_seed_id || null,
      exchange_notes: body.exchange_notes || null,
      status: 'pending'
    };
    
    const { data: exchangeRequest, error } = await supabase
      .from('seed_exchange_requests')
      .insert(requestData)
      .select(`
        *,
        seed:seed_id (
          id,
          name,
          variety,
          images
        ),
        requester:requester_id (
          id,
          name,
          avatar_url
        ),
        owner:owner_id (
          id,
          name,
          avatar_url
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Error creating exchange request:', error);
      throw error;
    }
    
    console.log('✅ Exchange request created:', exchangeRequest.id);
    
    // TODO: Send notification to owner
    
    return NextResponse.json(exchangeRequest, { status: 201 });
  } catch (error) {
    console.error('❌ Error in exchange request POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create exchange request' },
      { status: 500 }
    );
  }
}

// PUT - Update exchange request status
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { requestId, status, response_message, meetup_location, meetup_date, meetup_notes } = body;
    
    console.log('🤝 Updating exchange request:', requestId, 'to status:', status);
    
    // Verify ownership
    const { data: request } = await supabase
      .from('seed_exchange_requests')
      .select('owner_id, requester_id')
      .eq('id', requestId)
      .single();
    
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    
    // Only owner can accept/reject, both can mark as completed
    if ((status === 'accepted' || status === 'rejected') && request.owner_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (status === 'cancelled' && request.requester_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updateData = {
      status,
      response_message: response_message || null,
      meetup_location: meetup_location || null,
      meetup_date: meetup_date || null,
      meetup_notes: meetup_notes || null,
      responded_at: (status === 'accepted' || status === 'rejected') ? new Date().toISOString() : null,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    };
    
    const { data: updatedRequest, error } = await supabase
      .from('seed_exchange_requests')
      .update(updateData)
      .eq('id', requestId)
      .select(`
        *,
        seed:seed_id (
          id,
          name,
          variety,
          images
        ),
        requester:requester_id (
          id,
          name,
          avatar_url
        ),
        owner:owner_id (
          id,
          name,
          avatar_url
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Error updating exchange request:', error);
      throw error;
    }
    
    console.log('✅ Exchange request updated');
    
    // TODO: Send notification to the other party
    
    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('❌ Error in exchange request PUT:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update exchange request' },
      { status: 500 }
    );
  }
}

