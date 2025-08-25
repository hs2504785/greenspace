import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();
    const reviewData = await request.json();

    // Validate that user can review this order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, seller_id, status")
      .eq("id", reviewData.order_id)
      .eq("user_id", session.user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "You can only review delivered orders" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("order_id", reviewData.order_id)
      .eq("buyer_id", session.user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this order" },
        { status: 400 }
      );
    }

    // Create the review
    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        order_id: reviewData.order_id,
        product_id: reviewData.product_id,
        seller_id: reviewData.seller_id,
        buyer_id: session.user.id,

        // Ratings
        overall_rating: reviewData.overall_rating,
        quality_rating: reviewData.quality_rating,
        freshness_rating: reviewData.freshness_rating,
        natural_practice_rating: reviewData.natural_practice_rating,
        seller_communication_rating: reviewData.seller_communication_rating,
        packaging_quality: reviewData.packaging_quality,

        // Written feedback
        review_text: reviewData.review_text,
        pros: reviewData.pros || null,
        cons: reviewData.cons || null,

        // Verification questions
        verified_natural: reviewData.verified_natural,
        would_recommend: reviewData.would_recommend,

        // Photos
        review_photos: reviewData.review_photos || [],

        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    // Update seller statistics
    await updateSellerStats(supabase, reviewData.seller_id);

    // Check if seller qualifies for community trusted badge
    await checkCommunityTrustedBadge(supabase, reviewData.seller_id);

    return NextResponse.json({
      message: "Review submitted successfully",
      review: data,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);

    const sellerId = searchParams.get("seller_id");
    const productId = searchParams.get("product_id");
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = parseInt(searchParams.get("offset")) || 0;

    let query = supabase
      .from("product_reviews")
      .select(
        `
        *,
        buyer:users!product_reviews_buyer_id_fkey(name, avatar_url),
        product:vegetables(name),
        seller:users!product_reviews_seller_id_fkey(name, business_name)
      `
      )
      .eq("status", "active")
      .eq("flagged", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (sellerId) {
      query = query.eq("seller_id", sellerId);
    }

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Also get summary statistics
    let statsQuery = supabase
      .from("product_reviews")
      .select(
        "overall_rating, natural_practice_rating, would_recommend, verified_natural"
      )
      .eq("status", "active")
      .eq("flagged", false);

    if (sellerId) {
      statsQuery = statsQuery.eq("seller_id", sellerId);
    }

    if (productId) {
      statsQuery = statsQuery.eq("product_id", productId);
    }

    const { data: stats } = await statsQuery;

    const summary = {
      total_reviews: stats?.length || 0,
      average_rating: stats?.length
        ? (
            stats.reduce((sum, review) => sum + review.overall_rating, 0) /
            stats.length
          ).toFixed(1)
        : 0,
      natural_practice_rating: stats?.length
        ? (
            stats.reduce(
              (sum, review) => sum + review.natural_practice_rating,
              0
            ) / stats.length
          ).toFixed(1)
        : 0,
      recommendation_percentage: stats?.length
        ? Math.round(
            (stats.filter((review) => review.would_recommend).length /
              stats.length) *
              100
          )
        : 0,
      verified_natural_percentage: stats?.length
        ? Math.round(
            (stats.filter((review) => review.verified_natural).length /
              stats.length) *
              100
          )
        : 0,
    };

    return NextResponse.json({
      reviews: data,
      summary,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

async function updateSellerStats(supabase, sellerId) {
  try {
    // Get all reviews for this seller
    const { data: reviews } = await supabase
      .from("product_reviews")
      .select("overall_rating, buyer_id")
      .eq("seller_id", sellerId)
      .eq("status", "active");

    if (reviews && reviews.length > 0) {
      const totalReviews = reviews.length;
      const averageRating =
        reviews.reduce((sum, review) => sum + review.overall_rating, 0) /
        totalReviews;
      const uniqueBuyers = new Set(reviews.map((review) => review.buyer_id))
        .size;

      // Update seller farm profile
      await supabase
        .from("seller_farm_profiles")
        .update({
          total_orders: totalReviews,
          repeat_customers: totalReviews - uniqueBuyers,
          average_rating: averageRating,
        })
        .eq("seller_id", sellerId);
    }
  } catch (error) {
    console.error("Error updating seller stats:", error);
  }
}

async function checkCommunityTrustedBadge(supabase, sellerId) {
  try {
    // Check if seller already has community trusted badge
    const { data: existingBadge } = await supabase
      .from("seller_verification_badges")
      .select("id")
      .eq("seller_id", sellerId)
      .eq("badge_type", "community_trusted")
      .eq("active", true)
      .single();

    if (existingBadge) return;

    // Check if seller qualifies (10+ reviews with 4+ average rating)
    const { data: reviews } = await supabase
      .from("product_reviews")
      .select("overall_rating")
      .eq("seller_id", sellerId)
      .eq("status", "active");

    if (reviews && reviews.length >= 10) {
      const averageRating =
        reviews.reduce((sum, review) => sum + review.overall_rating, 0) /
        reviews.length;

      if (averageRating >= 4.0) {
        // Award community trusted badge
        await supabase.from("seller_verification_badges").insert({
          seller_id: sellerId,
          badge_type: "community_trusted",
          badge_name: "Community Trusted",
          badge_description: "Highly rated by the buyer community",
          verification_notes: `Automatically awarded for maintaining ${averageRating.toFixed(
            1
          )}/5 rating across ${reviews.length} reviews`,
        });
      }
    }
  } catch (error) {
    console.error("Error checking community trusted badge:", error);
  }
}
