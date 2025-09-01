import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/options";
import ListingLimitService from "@/services/ListingLimitService";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const summary = await ListingLimitService.getUserListingSummary(userId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching listing limits:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing limits" },
      { status: 500 }
    );
  }
}
