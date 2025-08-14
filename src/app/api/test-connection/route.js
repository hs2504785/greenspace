import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic query
    const { data, error } = await supabase
      .from('orders')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    return NextResponse.json({
      success: true,
      data,
      tables: await testTables()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

async function testTables() {
  const tables = ['orders', 'order_items', 'vegetables', 'users'];
  const results = {};

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      results[table] = {
        exists: !error,
        count,
        error: error?.message,
        sample: data
      };
    } catch (error) {
      results[table] = {
        exists: false,
        error: error.message
      };
    }
  }

  return results;
}