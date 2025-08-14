import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const tables = ['users', 'vegetables', 'orders', 'discussions', 'comments'];
  const results = {};

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      results[table] = {
        exists: !error,
        count: count || 0,
        data: data,
        error: error?.message || null
      };
    } catch (error) {
      results[table] = {
        exists: false,
        error: error.message
      };
    }
  }

  return NextResponse.json(results);
}