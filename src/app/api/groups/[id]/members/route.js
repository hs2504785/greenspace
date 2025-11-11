import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch group members
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const role = searchParams.get('role');

    console.log('🌾 Fetching members for group:', id);

    let query = supabase
      .from('group_memberships')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          avatar_url,
          location,
          role
        )
      `)
      .eq('group_id', id)
      .eq('status', status)
      .order('joined_at', { ascending: false });

    // Filter by role if specified
    if (role) {
      query = query.eq('role', role);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('❌ Error fetching members:', error);
      throw error;
    }

    console.log(`✅ Fetched ${members?.length || 0} members`);
    return NextResponse.json(members || []);

  } catch (error) {
    console.error('❌ Error in members GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

