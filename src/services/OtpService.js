import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class OtpService {
  constructor() {
    this.twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require("twilio");
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
      } catch (error) {
        console.warn("Twilio not configured properly:", error.message);
      }
    }
  }

  // Generate a 6-digit OTP
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Validate phone number format (Indian mobile numbers)
  validatePhoneNumber(phoneNumber) {
    // Remove any spaces, dashes, or other characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Check if it's a valid 10-digit Indian mobile number
    if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
      return cleaned;
    }

    // Check if it's a valid international format with country code
    if (
      cleaned.length === 12 &&
      cleaned.startsWith("91") &&
      /^91[6-9]\d{9}$/.test(cleaned)
    ) {
      return cleaned.substring(2); // Return without country code for storage
    }

    return null;
  }

  // Format phone number for Twilio (with country code)
  formatPhoneForSms(phoneNumber) {
    const cleaned = this.validatePhoneNumber(phoneNumber);
    if (!cleaned) return null;
    return `+91${cleaned}`;
  }

  // Store OTP in database
  async storeOtp(phoneNumber, otp) {
    try {
      const validatedPhone = this.validatePhoneNumber(phoneNumber);
      if (!validatedPhone) {
        throw new Error("Invalid phone number format");
      }

      // Delete any existing OTPs for this phone number
      await supabase
        .from("otp_verifications")
        .delete()
        .eq("phone_number", validatedPhone);

      // Store new OTP with 5-minute expiry
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      const { data, error } = await supabase
        .from("otp_verifications")
        .insert({
          phone_number: validatedPhone,
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
          verified: false,
          attempts: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error storing OTP:", error);
        throw new Error("Failed to store OTP");
      }

      return data;
    } catch (error) {
      console.error("Store OTP error:", error);
      throw error;
    }
  }

  // Send OTP via SMS
  async sendOtp(phoneNumber) {
    try {
      const otp = this.generateOtp();
      const formattedPhone = this.formatPhoneForSms(phoneNumber);

      if (!formattedPhone) {
        throw new Error("Invalid phone number format");
      }

      // Store OTP in database first
      await this.storeOtp(phoneNumber, otp);

      // For development/testing, just log the OTP
      if (process.env.NODE_ENV === "development") {
        console.log(`🔐 OTP for ${formattedPhone}: ${otp}`);
        return {
          success: true,
          message: "OTP sent successfully (check console in dev mode)",
        };
      }

      // Send via Twilio in production
      if (this.twilioClient) {
        const message = await this.twilioClient.messages.create({
          body: `Your Arya Natural Farms verification code is: ${otp}. This code will expire in 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });

        console.log("SMS sent successfully:", message.sid);
        return { success: true, message: "OTP sent successfully" };
      } else {
        // Fallback: just store OTP without sending (for demo purposes)
        console.log(
          `📱 OTP for ${formattedPhone}: ${otp} (SMS service not configured)`
        );
        return {
          success: true,
          message: "OTP generated (SMS service not configured)",
        };
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      throw new Error("Failed to send OTP: " + error.message);
    }
  }

  // Verify OTP
  async verifyOtp(phoneNumber, otpCode) {
    try {
      const validatedPhone = this.validatePhoneNumber(phoneNumber);
      if (!validatedPhone) {
        throw new Error("Invalid phone number format");
      }

      // Find the OTP record
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("phone_number", validatedPhone)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !otpRecord) {
        throw new Error("Invalid or expired OTP");
      }

      // Check if OTP has expired
      if (new Date() > new Date(otpRecord.expires_at)) {
        throw new Error("OTP has expired");
      }

      // Check attempts limit
      if (otpRecord.attempts >= 3) {
        throw new Error("Maximum verification attempts exceeded");
      }

      // Verify OTP code
      if (otpRecord.otp_code !== otpCode) {
        // Increment attempts
        await supabase
          .from("otp_verifications")
          .update({ attempts: otpRecord.attempts + 1 })
          .eq("id", otpRecord.id);

        throw new Error("Invalid OTP code");
      }

      // Mark as verified
      await supabase
        .from("otp_verifications")
        .update({ verified: true })
        .eq("id", otpRecord.id);

      return { success: true, phoneNumber: validatedPhone };
    } catch (error) {
      console.error("Verify OTP error:", error);
      throw error;
    }
  }

  // Clean up expired OTPs (can be called periodically)
  async cleanupExpiredOtps() {
    try {
      const { error } = await supabase
        .from("otp_verifications")
        .delete()
        .lt("expires_at", new Date().toISOString());

      if (error) {
        console.error("Error cleaning up expired OTPs:", error);
      } else {
        console.log("Expired OTPs cleaned up successfully");
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
}

export default new OtpService();
