import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch all seed categories
export async function GET() {
  try {
    console.log('📂 Fetching seed categories');
    
    const { data: categories, error } = await supabase
      .from('seed_categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${categories?.length || 0} categories`);
    
    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('❌ Error in categories GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

