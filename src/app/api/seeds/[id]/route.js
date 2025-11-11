import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch single seed by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log('🌱 Fetching seed:', id);
    
    const { data: seed, error } = await supabase
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
          icon,
          description
        ),
        reviews:seed_reviews (
          id,
          rating,
          germination_rate,
          title,
          review_text,
          images,
          successfully_grown,
          harvest_date,
          created_at,
          reviewer:reviewer_id (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Error fetching seed:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Seed not found' }, { status: 404 });
      }
      throw error;
    }
    
    // Calculate averages
    const reviews = seed.reviews || [];
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;
    const avgGermination = reviews.length > 0
      ? Math.round(reviews.reduce((sum, r) => sum + (r.germination_rate || 0), 0) / reviews.length)
      : null;
    
    // Increment views count (fire and forget)
    supabase
      .from('seeds')
      .update({ views_count: seed.views_count + 1 })
      .eq('id', id)
      .then(() => console.log('📈 View count incremented'));
    
    const enrichedSeed = {
      ...seed,
      average_rating: avgRating ? parseFloat(avgRating) : null,
      average_germination_rate: avgGermination,
      review_count: reviews.length
    };
    
    console.log('✅ Seed fetched successfully');
    
    return NextResponse.json(enrichedSeed);
  } catch (error) {
    console.error('❌ Error in seed GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch seed' },
      { status: 500 }
    );
  }
}

// PUT - Update seed
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🌱 Updating seed:', id);
    
    const body = await request.json();
    
    // Verify ownership
    const { data: existingSeed } = await supabase
      .from('seeds')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!existingSeed || existingSeed.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this seed' },
        { status: 403 }
      );
    }
    
    // Update seed
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.created_at;
    delete updateData.views_count;
    delete updateData.exchange_count;
    
    const { data: seed, error } = await supabase
      .from('seeds')
      .update(updateData)
      .eq('id', id)
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
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Error updating seed:', error);
      throw error;
    }
    
    console.log('✅ Seed updated successfully');
    
    return NextResponse.json(seed);
  } catch (error) {
    console.error('❌ Error in seed PUT:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update seed' },
      { status: 500 }
    );
  }
}

// DELETE - Delete seed
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🗑️ Deleting seed:', id);
    
    // Verify ownership
    const { data: existingSeed } = await supabase
      .from('seeds')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!existingSeed || existingSeed.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this seed' },
        { status: 403 }
      );
    }
    
    // Soft delete (set status to inactive)
    const { error } = await supabase
      .from('seeds')
      .update({ status: 'inactive' })
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error deleting seed:', error);
      throw error;
    }
    
    console.log('✅ Seed deleted successfully');
    
    return NextResponse.json({ message: 'Seed deleted successfully' });
  } catch (error) {
    console.error('❌ Error in seed DELETE:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete seed' },
      { status: 500 }
    );
  }
}

