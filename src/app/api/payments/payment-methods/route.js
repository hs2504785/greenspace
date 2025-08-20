import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/options";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    // If sellerId is provided, get that seller's payment methods
    // Otherwise, get current user's payment methods
    const targetSellerId = sellerId || session.user.id;

    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("seller_id", targetSellerId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment methods:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch payment methods" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ paymentMethods: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in payment methods API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      methodType,
      upiId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      displayName,
    } = body;

    // Validate required fields
    if (!methodType) {
      return new Response(
        JSON.stringify({ error: "Payment method type is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (methodType === "upi" && !upiId) {
      return new Response(
        JSON.stringify({ error: "UPI ID is required for UPI payment method" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (methodType === "bank_account" && (!accountNumber || !ifscCode)) {
      return new Response(
        JSON.stringify({
          error: "Account number and IFSC code are required for bank account",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate UPI ID format if provided
    if (upiId) {
      const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+$/;
      if (!upiRegex.test(upiId)) {
        return new Response(
          JSON.stringify({ error: "Invalid UPI ID format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Insert new payment method
    const insertData = {
      seller_id: session.user.id,
      method_type: methodType,
      upi_id: upiId,
      account_holder_name: accountHolderName,
      bank_name: bankName,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      display_name: displayName || `${methodType} Payment`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("payment_methods")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Error creating payment method:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create payment method" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentMethod: data,
        message: "Payment method added successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in payment methods POST API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
