import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
