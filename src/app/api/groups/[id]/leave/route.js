import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST - Leave a group
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🌾 User leaving group:', { userId, groupId: id });

    // Check if user is a member
    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .select('*, group:group_id(created_by)')
      .eq('group_id', id)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 400 }
      );
    }

    if (membership.status !== 'active') {
      return NextResponse.json(
        { error: 'You have already left this group' },
        { status: 400 }
      );
    }

    // Check if user is the group creator - they need to transfer ownership first
    if (membership.group?.created_by === userId) {
      // Check if there are other admins
      const { data: otherAdmins } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', id)
        .eq('role', 'admin')
        .eq('status', 'active')
        .neq('user_id', userId);

      if (!otherAdmins || otherAdmins.length === 0) {
        return NextResponse.json(
          { error: 'As the group creator, you must assign another admin before leaving or delete the group' },
          { status: 400 }
        );
      }
    }

    // Update membership status to 'left'
    const { error: updateError } = await supabase
      .from('group_memberships')
      .update({ status: 'left' })
      .eq('id', membership.id);

    if (updateError) {
      console.error('❌ Error updating membership:', updateError);
      throw updateError;
    }

    console.log('✅ User left group successfully');
    return NextResponse.json({
      message: 'Successfully left the group'
    });

  } catch (error) {
    console.error('❌ Error leaving group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to leave group' },
      { status: 500 }
    );
  }
}

