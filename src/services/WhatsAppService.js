/**
 * Server-side WhatsApp Service for Farm Visit Notifications
 * Handles automatic WhatsApp messaging when farm visit requests are approved/rejected
 */

import { createSupabaseClient } from "@/utils/supabaseAuth";

// WhatsApp message templates
function generateFarmVisitApprovalMessage(
  request,
  farmDetails,
  adminNotes = ""
) {
  if (!request) {
    console.warn("WhatsApp: No farm visit request data provided");
    return "";
  }

  const visitDate = new Date(request.requested_date).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const startTime = formatTime12Hour(request.requested_time_start);
  const endTime = formatTime12Hour(request.requested_time_end);

  const farmName = farmDetails?.farm_name || farmDetails?.name || "Our Farm";
  const farmLocation =
    farmDetails?.location ||
    farmDetails?.address ||
    "Farm location will be shared";
  const farmPhone =
    farmDetails?.phone_number ||
    farmDetails?.whatsapp_number ||
    "Contact number will be shared";
  const whatsappNumber =
    farmDetails?.whatsapp_number || farmDetails?.phone_number;

  // Build message using simple string concatenation to avoid encoding issues
  let message = "*Farm Visit Approved!*\n\n";
  message += "Hello " + request.visitor_name + ",\n\n";
  message += "Great news! Your farm visit request has been approved.\n\n";

  message += "*Visit Details:*\n";
  message += "Farm: " + farmName + "\n";
  message += "Date: " + visitDate + "\n";
  message += "Time: " + startTime + " - " + endTime + "\n";
  message += "Visitors: " + request.number_of_visitors + "\n\n";

  if (request.purpose) {
    message += "*Purpose:* " + request.purpose + "\n\n";
  }

  message += "*Location Details:*\n" + farmLocation + "\n\n";

  // Add Google Maps link if we have location details
  if (
    farmDetails?.location &&
    farmDetails.location !== "Location details will be shared"
  ) {
    const encodedLocation = encodeURIComponent(farmLocation);
    message +=
      "*Google Maps:*\nhttps://maps.google.com/maps?q=" +
      encodedLocation +
      "\n\n";
  }

  message += "*Contact Information:*\n";
  message += "Phone: " + farmPhone + "\n";
  if (whatsappNumber && whatsappNumber !== farmPhone) {
    message += "WhatsApp: " + whatsappNumber + "\n";
  }
  message += "\n";

  if (adminNotes) {
    message += "*Special Instructions:*\n" + adminNotes + "\n\n";
  }

  message += "*Important Notes:*\n";
  message += "- Please arrive on time\n";
  message += "- Carry a valid ID\n";
  message += "- Wear comfortable clothing and closed shoes\n";
  message += "- Follow farm safety guidelines\n\n";

  message += "We are excited to welcome you to our farm!\n\n";
  message += "If you have any questions, please contact us directly.";

  return message;
}

function generateFarmVisitRejectionMessage(request, rejectionReason = "") {
  if (!request) {
    console.warn("WhatsApp: No farm visit request data provided");
    return "";
  }

  const visitDate = new Date(request.requested_date).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  let message = "*Farm Visit Request Update*\n\n";
  message += "Hello " + request.visitor_name + ",\n\n";
  message +=
    "We regret to inform you that your farm visit request for " +
    visitDate +
    " cannot be accommodated at this time.\n\n";

  if (rejectionReason) {
    message += "*Reason:* " + rejectionReason + "\n\n";
  }

  message += "We encourage you to:\n";
  message += "- Check our available dates and submit a new request\n";
  message += "- Contact us directly for alternative arrangements\n";
  message += "- Follow our updates for new availability\n\n";

  message +=
    "Thank you for your interest in visiting our farm. We hope to welcome you soon!";

  return message;
}

// Helper function to format time in 12-hour format
function formatTime12Hour(timeString) {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${ampm}`;
}

// Get visitor phone number from request
function getVisitorPhoneNumber(request) {
  return (
    request.visitor_phone ||
    request.user?.phone_number ||
    request.user?.whatsapp_number
  );
}

// Fetch farm details for the seller
async function getFarmDetails(sellerId) {
  try {
    const supabase = createSupabaseClient();

    // First try to get seller profile with farm details
    const { data: sellerProfile, error: profileError } = await supabase
      .from("users")
      .select(
        `
        id, name, email, phone_number, whatsapp_number,
        farm_name, location, address, bio, city, state, pincode
      `
      )
      .eq("id", sellerId)
      .single();

    if (profileError) {
      console.error("Error fetching seller profile:", profileError);
      return null;
    }

    // Build complete address
    let fullAddress = "";
    if (sellerProfile.address) {
      fullAddress = sellerProfile.address;
    } else if (sellerProfile.location) {
      fullAddress = sellerProfile.location;
    }

    // Add city, state, pincode if available
    const addressParts = [];
    if (sellerProfile.city) addressParts.push(sellerProfile.city);
    if (sellerProfile.state) addressParts.push(sellerProfile.state);
    if (sellerProfile.pincode) addressParts.push(sellerProfile.pincode);

    if (addressParts.length > 0) {
      if (fullAddress) {
        fullAddress += ", " + addressParts.join(", ");
      } else {
        fullAddress = addressParts.join(", ");
      }
    }

    return {
      farm_name: sellerProfile.farm_name || sellerProfile.name,
      name: sellerProfile.name,
      location: fullAddress || "Location details will be shared",
      address: fullAddress || "Address will be shared",
      phone_number: sellerProfile.phone_number,
      whatsapp_number: sellerProfile.whatsapp_number,
      city: sellerProfile.city,
      state: sellerProfile.state,
      pincode: sellerProfile.pincode,
    };
  } catch (error) {
    console.error("Error in getFarmDetails:", error);
    return null;
  }
}

// Send WhatsApp message via external API (placeholder for actual implementation)
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // Clean the message to remove any problematic characters while preserving formatting
    const cleanMessage = message
      .replace(/[^\x00-\x7F\n\r]/g, "") // Remove non-ASCII characters but keep newlines
      .replace(/[ \t]+/g, " ") // Replace multiple spaces/tabs with single space but keep newlines
      .trim();

    // For now, we'll log the message that would be sent
    // In a production environment, you would integrate with WhatsApp Business API
    console.log("=== WhatsApp Message ===");
    console.log("To:", phoneNumber);
    console.log("Message:");
    console.log(cleanMessage);
    console.log("========================");

    // TODO: Implement actual WhatsApp API integration
    // Example with WhatsApp Business API:
    /*
    const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: cleanMessage }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);
    */

    return {
      success: true,
      message: "WhatsApp message logged (demo mode)",
      cleanMessage,
    };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

// Main function to send farm visit WhatsApp messages
export async function sendFarmVisitWhatsAppMessage(request, status) {
  try {
    // Get visitor phone number
    const phoneNumber = getVisitorPhoneNumber(request);
    if (!phoneNumber) {
      console.warn(
        "No phone number available for visitor:",
        request.visitor_name
      );
      return { success: false, error: "No phone number available" };
    }

    // Get farm details
    const farmDetails = await getFarmDetails(request.seller_id);
    if (!farmDetails) {
      console.warn(
        "Could not fetch farm details for seller:",
        request.seller_id
      );
    }

    // Generate appropriate message based on status
    let message = "";
    if (status === "approved") {
      message = generateFarmVisitApprovalMessage(
        request,
        farmDetails,
        request.admin_notes
      );
    } else if (status === "rejected") {
      message = generateFarmVisitRejectionMessage(
        request,
        request.rejection_reason
      );
    } else {
      console.warn("Unsupported status for WhatsApp message:", status);
      return { success: false, error: "Unsupported status" };
    }

    if (!message) {
      console.warn("No message generated for status:", status);
      return { success: false, error: "No message generated" };
    }

    // Clean phone number (remove non-digits)
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

    // Send the message
    const result = await sendWhatsAppMessage(cleanPhoneNumber, message);

    console.log(
      `WhatsApp ${status} message sent to ${request.visitor_name} (${phoneNumber})`
    );
    return result;
  } catch (error) {
    console.error("Error in sendFarmVisitWhatsAppMessage:", error);
    throw error;
  }
}

// Export individual functions for testing or direct use
export {
  generateFarmVisitApprovalMessage,
  generateFarmVisitRejectionMessage,
  getFarmDetails,
  sendWhatsAppMessage,
};
