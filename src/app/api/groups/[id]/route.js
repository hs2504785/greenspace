import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch single group details
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    console.log('🌾 Fetching group:', id);

    const { data: group, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching group:', error);
      throw error;
    }

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is a member
    let userMembership = null;
    if (userId) {
      const { data: membership } = await supabase
        .from('group_memberships')
        .select('*')
        .eq('group_id', id)
        .eq('user_id', userId)
        .single();
      
      userMembership = membership;
    }

    // Add membership info to response
    const response = {
      ...group,
      user_membership: userMembership
    };

    console.log('✅ Group fetched successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in group GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

// PUT - Update group details
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🌾 Updating group:', id);

    // Check if user has permission (admin or moderator)
    const { data: membership } = await supabase
      .from('group_memberships')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const { data: existingGroup } = await supabase
      .from('farming_groups')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const isCreator = existingGroup.created_by === userId;
    const isAdmin = membership?.role === 'admin';
    const isModerator = membership?.role === 'moderator';

    if (!isCreator && !isAdmin && !isModerator) {
      return NextResponse.json(
        { error: 'You do not have permission to update this group' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // If slug is being changed, check for conflicts
    if (body.slug && body.slug !== existingGroup.slug) {
      const { data: slugConflict } = await supabase
        .from('farming_groups')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .single();

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A group with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_by;
    delete updateData.created_at;
    delete updateData.member_count;
    delete updateData.post_count;
    delete updateData.event_count;

    const { data: group, error } = await supabase
      .from('farming_groups')
      .update(updateData)
      .eq('id', id)
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

    if (error) {
      console.error('❌ Error updating group:', error);
      throw error;
    }

    console.log('✅ Group updated successfully');
    return NextResponse.json(group);

  } catch (error) {
    console.error('❌ Error in group PUT:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update group' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a group
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🌾 Deleting group:', id);

    // Check if user is the creator
    const { data: existingGroup } = await supabase
      .from('farming_groups')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (existingGroup.created_by !== userId) {
      return NextResponse.json(
        { error: 'Only the group creator can delete the group' },
        { status: 403 }
      );
    }

    // Instead of deleting, archive the group
    const { error } = await supabase
      .from('farming_groups')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting group:', error);
      throw error;
    }

    console.log('✅ Group deleted successfully');
    return NextResponse.json({ message: 'Group deleted successfully' });

  } catch (error) {
    console.error('❌ Error in group DELETE:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete group' },
      { status: 500 }
    );
  }
}

