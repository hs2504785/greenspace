import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// PUT - Update member role or remove member
export async function PUT(request, { params }) {
  try {
    const { id: groupId, userId: targetUserId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    console.log('🌾 Updating member:', { groupId, targetUserId, by: currentUserId });

    // Check current user's permission
    const { data: currentUserMembership } = await supabase
      .from('group_memberships')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', currentUserId)
      .eq('status', 'active')
      .single();

    if (!currentUserMembership || !['admin', 'moderator'].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, status, action } = body;

    // Moderators can only manage members, not other moderators or admins
    if (currentUserMembership.role === 'moderator') {
      const { data: targetMembership } = await supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', targetUserId)
        .single();

      if (targetMembership && ['admin', 'moderator'].includes(targetMembership.role)) {
        return NextResponse.json(
          { error: 'Moderators cannot manage other moderators or admins' },
          { status: 403 }
        );
      }
    }

    // Handle different actions
    if (action === 'remove') {
      // Remove member from group
      const { error: removeError } = await supabase
        .from('group_memberships')
        .update({ status: 'removed' })
        .eq('group_id', groupId)
        .eq('user_id', targetUserId);

      if (removeError) throw removeError;

      console.log('✅ Member removed successfully');
      return NextResponse.json({ message: 'Member removed successfully' });
    }

    // Update member role or status
    const updateData = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const { data: membership, error: updateError } = await supabase
      .from('group_memberships')
      .update(updateData)
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar_url,
          location
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Error updating member:', updateError);
      throw updateError;
    }

    console.log('✅ Member updated successfully');
    return NextResponse.json(membership);

  } catch (error) {
    console.error('❌ Error in member PUT:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from group
export async function DELETE(request, { params }) {
  try {
    const { id: groupId, userId: targetUserId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    console.log('🌾 Removing member:', { groupId, targetUserId, by: currentUserId });

    // Check current user's permission
    const { data: currentUserMembership } = await supabase
      .from('group_memberships')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', currentUserId)
      .eq('status', 'active')
      .single();

    if (!currentUserMembership || !['admin', 'moderator'].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to remove members' },
        { status: 403 }
      );
    }

    // Moderators can only remove regular members
    if (currentUserMembership.role === 'moderator') {
      const { data: targetMembership } = await supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', targetUserId)
        .single();

      if (targetMembership && ['admin', 'moderator'].includes(targetMembership.role)) {
        return NextResponse.json(
          { error: 'Moderators cannot remove other moderators or admins' },
          { status: 403 }
        );
      }
    }

    // Remove member
    const { error } = await supabase
      .from('group_memberships')
      .update({ status: 'removed' })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId);

    if (error) {
      console.error('❌ Error removing member:', error);
      throw error;
    }

    console.log('✅ Member removed successfully');
    return NextResponse.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('❌ Error in member DELETE:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove member' },
      { status: 500 }
    );
  }
}

