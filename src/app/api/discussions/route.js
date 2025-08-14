import { NextResponse } from 'next/server';
import ApiBaseService from '@/services/ApiBaseService';

const discussionsService = new ApiBaseService('discussions');

// GET: List all discussions (optionally filter by type)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const filters = {};
    if (type) filters.type = type;
    const result = await discussionsService.getAll({ page, limit, filters });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new discussion
export async function POST(req) {
  try {
    const body = await req.json();
    const { title, content, type, user_id } = body;
    if (!title || !content || !type || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await discussionsService.create({ title, content, type, user_id });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
