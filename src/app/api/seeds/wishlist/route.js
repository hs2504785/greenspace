import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - Fetch user's seed wishlist
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('💚 Fetching wishlist for user:', user.id);
    
    const { data: wishlist, error } = await supabaseAuth
      .from('seed_wishlists')
      .select(`
        *,
        category:category_id (
          id,
          name,
          icon
        ),
        fulfilled_seed:fulfilled_by_seed_id (
          id,
          name,
          variety,
          images,
          user_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching wishlist:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${wishlist?.length || 0} wishlist items`);
    
    // Find matching seeds for each wishlist item
    const enrichedWishlist = await Promise.all(
      (wishlist || []).map(async (item) => {
        // Search for matching seeds
        const { data: matchingSeeds } = await supabase
          .from('seeds')
          .select(`
            id,
            name,
            variety,
            images,
            price,
            is_free,
            user:user_id (
              id,
              name,
              location
            )
          `)
          .eq('status', 'active')
          .ilike('name', `%${item.seed_name}%`)
          .limit(3);
        
        return {
          ...item,
          matching_seeds: matchingSeeds || []
        };
      })
    );
    
    return NextResponse.json(enrichedWishlist);
  } catch (error) {
    console.error('❌ Error in wishlist GET:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST - Add item to wishlist
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    console.log('💚 Adding to wishlist:', body.seed_name);
    
    const wishlistData = {
      user_id: user.id,
      seed_name: body.seed_name,
      category_id: body.category_id || null,
      variety: body.variety || null,
      notes: body.notes || null,
      priority: body.priority || 'medium'
    };
    
    const { data: wishlistItem, error } = await supabaseAuth
      .from('seed_wishlists')
      .insert(wishlistData)
      .select(`
        *,
        category:category_id (
          id,
          name,
          icon
        )
      `)
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'This seed is already in your wishlist' },
          { status: 400 }
        );
      }
      console.error('❌ Error adding to wishlist:', error);
      throw error;
    }
    
    console.log('✅ Added to wishlist:', wishlistItem.id);
    
    return NextResponse.json(wishlistItem, { status: 201 });
  } catch (error) {
    console.error('❌ Error in wishlist POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from wishlist
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const wishlistId = searchParams.get('id');
    
    if (!wishlistId) {
      return NextResponse.json(
        { error: 'Wishlist item ID is required' },
        { status: 400 }
      );
    }
    
    console.log('🗑️ Removing from wishlist:', wishlistId);
    
    const { error } = await supabaseAuth
      .from('seed_wishlists')
      .delete()
      .eq('id', wishlistId)
      .eq('user_id', user.id); // Ensure user owns this wishlist item
    
    if (error) {
      console.error('❌ Error removing from wishlist:', error);
      throw error;
    }
    
    console.log('✅ Removed from wishlist');
    
    return NextResponse.json({ message: 'Removed from wishlist successfully' });
  } catch (error) {
    console.error('❌ Error in wishlist DELETE:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}

