import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch group posts (feed)
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const post_type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🌾 Fetching posts for group:', id);

    let query = supabase
      .from('group_posts')
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar_url,
          location
        )
      `)
      .eq('group_id', id)
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by post type
    if (post_type) {
      query = query.eq('post_type', post_type);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('❌ Error fetching posts:', error);
      throw error;
    }

    console.log(`✅ Fetched ${posts?.length || 0} posts`);
    return NextResponse.json(posts || []);

  } catch (error) {
    console.error('❌ Error in posts GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST - Create a new post
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🌾 Creating post in group:', id);

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
        { error: 'You must be a member to post in this group' },
        { status: 403 }
      );
    }

    // Check group settings
    const { data: group } = await supabase
      .from('farming_groups')
      .select('allow_member_posts')
      .eq('id', id)
      .single();

    if (!group?.allow_member_posts && membership.role === 'member') {
      return NextResponse.json(
        { error: 'Only admins and moderators can post in this group' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const postData = {
      group_id: id,
      user_id: userId,
      title: body.title || null,
      content: body.content,
      post_type: body.post_type || 'discussion',
      images: body.images || [],
      attachments: body.attachments || null,
      status: 'published'
    };

    const { data: post, error: postError } = await supabase
      .from('group_posts')
      .insert(postData)
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

    if (postError) {
      console.error('❌ Error creating post:', postError);
      throw postError;
    }

    console.log('✅ Post created successfully');
    return NextResponse.json(post);

  } catch (error) {
    console.error('❌ Error in posts POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}

