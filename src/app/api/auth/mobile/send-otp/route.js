import OtpService from "@/services/OtpService";

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Phone number is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate phone number format
    const validatedPhone = OtpService.validatePhoneNumber(phoneNumber);
    if (!validatedPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Invalid phone number format. Please enter a valid 10-digit mobile number.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send OTP
    const result = await OtpService.sendOtp(phoneNumber);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send OTP API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to send OTP",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
