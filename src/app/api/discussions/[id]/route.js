import { NextResponse } from 'next/server';
import ApiBaseService from '@/services/ApiBaseService';

const discussionsService = new ApiBaseService('discussions');

// GET: Get a single discussion by ID
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const discussion = await discussionsService.getById(id);
    return NextResponse.json(discussion);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
