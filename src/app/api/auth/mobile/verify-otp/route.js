import OtpService from "@/services/OtpService";

export async function POST(request) {
  try {
    const { phoneNumber, otpCode } = await request.json();

    if (!phoneNumber || !otpCode) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Phone number and OTP code are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify OTP
    const result = await OtpService.verifyOtp(phoneNumber, otpCode);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verify OTP API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to verify OTP",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
