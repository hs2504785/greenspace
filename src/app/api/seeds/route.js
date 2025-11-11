import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch all seeds with filters
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const category = searchParams.get('category');
  const isFree = searchParams.get('isFree');
  const isHeirloom = searchParams.get('isHeirloom');
  const searchQuery = searchParams.get('search');
  const userId = searchParams.get('userId'); // Get seeds by specific user
  const status = searchParams.get('status') || 'active';
  
  try {
    console.log('🌱 Fetching seeds with filters:', {
      category,
      isFree,
      isHeirloom,
      searchQuery,
      userId,
      status
    });

    let query = supabase
      .from('seeds')
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar_url,
          location,
          role,
          phone,
          whatsapp_number
        ),
        category:category_id (
          id,
          name,
          icon
        ),
        reviews:seed_reviews (
          rating,
          germination_rate
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }
    
    if (isFree === 'true') {
      query = query.eq('is_free', true);
    }
    
    if (isHeirloom === 'true') {
      query = query.eq('is_heirloom', true);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,variety.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,scientific_name.ilike.%${searchQuery}%`);
    }
    
    const { data: seeds, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching seeds:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: error.message, details: error.details || 'No additional details' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Fetched ${seeds?.length || 0} seeds`);
    
    // Handle empty result
    if (!seeds || seeds.length === 0) {
      console.log('📭 No seeds found in database yet');
      return NextResponse.json([]);
    }
    
    // Calculate average ratings and germination rates
    const enrichedSeeds = seeds.map(seed => {
      const reviews = seed.reviews || [];
      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : null;
      const avgGermination = reviews.length > 0
        ? Math.round(reviews.reduce((sum, r) => sum + (r.germination_rate || 0), 0) / reviews.length)
        : null;
      
      return {
        ...seed,
        average_rating: avgRating ? parseFloat(avgRating) : null,
        average_germination_rate: avgGermination,
        review_count: reviews.length
      };
    });
    
    return NextResponse.json(enrichedSeeds);
  } catch (error) {
    console.error('❌ Error in seeds GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch seeds' },
      { status: 500 }
    );
  }
}

// POST - Create new seed listing
export async function POST(request) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('❌ No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('🌱 Creating seed for user:', userId);
    
    const body = await request.json();
    
    // Get user's location for caching
    const { data: userData } = await supabase
      .from('users')
      .select('location')
      .eq('id', userId)
      .single();
    
    // Prepare seed data
    const seedData = {
      user_id: userId,
      name: body.name,
      scientific_name: body.scientific_name || null,
      variety: body.variety || null,
      description: body.description || null,
      category_id: body.category_id || null,
      seed_type: body.seed_type || 'seed',
      is_heirloom: body.is_heirloom || false,
      is_open_pollinated: body.is_open_pollinated || false,
      is_hybrid: body.is_hybrid || false,
      quantity_available: body.quantity_available || 0,
      quantity_unit: body.quantity_unit || 'packets',
      price: body.price || 0,
      is_free: body.is_free || body.price === 0,
      is_for_exchange: body.is_for_exchange !== undefined ? body.is_for_exchange : true,
      growing_season: body.growing_season || null,
      days_to_germination: body.days_to_germination || null,
      days_to_harvest: body.days_to_harvest || null,
      difficulty_level: body.difficulty_level || null,
      growing_tips: body.growing_tips || null,
      origin_location: body.origin_location || null,
      year_collected: body.year_collected || null,
      source_info: body.source_info || null,
      images: body.images || [],
      status: 'active',
      location: userData?.location || null,
    };
    
    console.log('📝 Seed data prepared:', seedData);
    
    const { data: seed, error } = await supabase
      .from('seeds')
      .insert(seedData)
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar_url,
          location
        ),
        category:category_id (
          id,
          name,
          icon
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Error creating seed:', error);
      throw error;
    }
    
    console.log('✅ Seed created successfully:', seed.id);
    
    return NextResponse.json(seed, { status: 201 });
  } catch (error) {
    console.error('❌ Error in seeds POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create seed' },
      { status: 500 }
    );
  }
}

