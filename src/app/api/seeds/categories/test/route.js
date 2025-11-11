import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 Testing categories endpoint...');
  console.log('Environment check:');
  console.log('- SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('- SUPABASE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('Supabase client created');
    
    const { data, error } = await supabase
      .from('seed_categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    console.log('Query executed');
    console.log('Error:', error);
    console.log('Data length:', data?.length);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      categories: data,
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('Caught error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

