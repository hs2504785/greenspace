import { NextResponse } from 'next/server';
import ApiBaseService from '@/services/ApiBaseService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

const messagesService = new ApiBaseService('messages');

// GET: List all messages for a discussion
export async function GET(req, { params }) {
  try {
    const { id: discussionId } = params;
    const result = await messagesService.getAll({
      filters: { discussion_id: discussionId },
      orderBy: 'created_at',
      orderDirection: 'asc',
      limit: 100
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new message/reply
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id: discussionId } = params;
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const created = await messagesService.create({
      discussion_id: discussionId,
      user_id: session.user.id,
      content
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
