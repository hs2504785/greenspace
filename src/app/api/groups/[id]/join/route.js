import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST - Join a group
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🌾 User joining group:', { userId, groupId: id });

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('farming_groups')
      .select('id, name, max_members, member_count, auto_approve_members, status')
      .eq('id', id)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (group.status !== 'active') {
      return NextResponse.json(
        { error: 'This group is not accepting new members' },
        { status: 400 }
      );
    }

    // Check if max members limit reached
    if (group.max_members > 0 && group.member_count >= group.max_members) {
      return NextResponse.json(
        { error: 'This group has reached its member limit' },
        { status: 400 }
      );
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('group_id', id)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return NextResponse.json(
          { error: 'You are already a member of this group' },
          { status: 400 }
        );
      } else {
        // Reactivate membership
        const { data: membership, error: updateError } = await supabase
          .from('group_memberships')
          .update({ status: 'active', joined_at: new Date().toISOString() })
          .eq('id', existingMembership.id)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log('✅ Membership reactivated');
        return NextResponse.json({
          message: 'Successfully rejoined the group',
          membership
        });
      }
    }

    // Create new membership
    const membershipData = {
      group_id: id,
      user_id: userId,
      role: 'member',
      status: 'active',
      joined_at: new Date().toISOString()
    };

    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .insert(membershipData)
      .select(`
        *,
        group:group_id (
          id,
          name,
          slug,
          location
        )
      `)
      .single();

    if (membershipError) {
      console.error('❌ Error creating membership:', membershipError);
      throw membershipError;
    }

    console.log('✅ User joined group successfully');
    return NextResponse.json({
      message: 'Successfully joined the group',
      membership
    });

  } catch (error) {
    console.error('❌ Error joining group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join group' },
      { status: 500 }
    );
  }
}

