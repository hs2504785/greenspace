import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Check environment variables
  results.tests.push({
    name: 'Environment Variables',
    status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PASS' : 'FAIL',
    details: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
    }
  });

  // Test 2: Check seed_categories table
  try {
    const { data: categories, error } = await supabase
      .from('seed_categories')
      .select('*')
      .limit(1);
    
    results.tests.push({
      name: 'seed_categories table',
      status: error ? 'FAIL' : 'PASS',
      details: {
        error: error?.message || null,
        rowCount: categories?.length || 0
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'seed_categories table',
      status: 'ERROR',
      details: { error: error.message }
    });
  }

  // Test 3: Check seeds table
  try {
    const { data: seeds, error } = await supabase
      .from('seeds')
      .select('*')
      .limit(1);
    
    results.tests.push({
      name: 'seeds table',
      status: error ? 'FAIL' : 'PASS',
      details: {
        error: error?.message || null,
        rowCount: seeds?.length || 0
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'seeds table',
      status: 'ERROR',
      details: { error: error.message }
    });
  }

  // Test 4: Check seeds with join
  try {
    const { data: seeds, error } = await supabase
      .from('seeds')
      .select(`
        *,
        user:user_id (
          id,
          name
        ),
        category:category_id (
          id,
          name
        )
      `)
      .limit(1);
    
    results.tests.push({
      name: 'seeds table with joins',
      status: error ? 'FAIL' : 'PASS',
      details: {
        error: error?.message || null,
        errorDetails: error?.details || null,
        errorHint: error?.hint || null,
        rowCount: seeds?.length || 0
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'seeds table with joins',
      status: 'ERROR',
      details: { error: error.message }
    });
  }

  // Test 5: Count all categories
  try {
    const { count, error } = await supabase
      .from('seed_categories')
      .select('*', { count: 'exact', head: true });
    
    results.tests.push({
      name: 'seed_categories count',
      status: error ? 'FAIL' : 'PASS',
      details: {
        error: error?.message || null,
        totalCategories: count || 0
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'seed_categories count',
      status: 'ERROR',
      details: { error: error.message }
    });
  }

  const allPassed = results.tests.every(t => t.status === 'PASS');
  
  return NextResponse.json({
    overall: allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌',
    ...results
  }, { status: allPassed ? 200 : 500 });
}

