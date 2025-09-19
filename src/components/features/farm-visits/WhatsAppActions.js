"use client";

import { Button, Dropdown, ButtonGroup } from "react-bootstrap";
import {
  openWhatsApp,
  generateFarmVisitApprovalMessage,
  generateFarmVisitRejectionMessage,
  generateFarmVisitCompletedMessage,
} from "@/utils/whatsapp";

export default function FarmVisitWhatsAppActions({
  request,
  farmDetails,
  userRole = "seller",
  onMessageSent,
}) {
  const getVisitorPhoneNumber = () => {
    // Try different phone number fields
    return (
      request.visitor_phone ||
      request.user?.phone_number ||
      request.user?.whatsapp_number
    );
  };

  const getFarmPhoneNumber = () => {
    return (
      farmDetails?.whatsapp_number ||
      farmDetails?.phone_number ||
      request.seller?.whatsapp_number ||
      request.seller?.phone_number
    );
  };

  const handleSendApprovalMessage = (adminNotes = "") => {
    const phoneNumber = getVisitorPhoneNumber();
    if (!phoneNumber) {
      alert("Visitor phone number not available");
      return;
    }

    const message = generateFarmVisitApprovalMessage(
      request,
      farmDetails,
      adminNotes
    );
    openWhatsApp(phoneNumber, message);

    if (onMessageSent) {
      onMessageSent("approval", phoneNumber);
    }
  };

  const handleSendRejectionMessage = (rejectionReason = "") => {
    const phoneNumber = getVisitorPhoneNumber();
    if (!phoneNumber) {
      alert("Visitor phone number not available");
      return;
    }

    const message = generateFarmVisitRejectionMessage(request, rejectionReason);
    openWhatsApp(phoneNumber, message);

    if (onMessageSent) {
      onMessageSent("rejection", phoneNumber);
    }
  };

  const handleSendCompletedMessage = () => {
    const phoneNumber = getVisitorPhoneNumber();
    if (!phoneNumber) {
      alert("Visitor phone number not available");
      return;
    }

    const message = generateFarmVisitCompletedMessage(request, farmDetails);
    openWhatsApp(phoneNumber, message);

    if (onMessageSent) {
      onMessageSent("completed", phoneNumber);
    }
  };

  const handleCustomMessage = () => {
    const phoneNumber = getVisitorPhoneNumber();
    if (!phoneNumber) {
      alert("Visitor phone number not available");
      return;
    }

    const message = `Hi ${
      request.visitor_name
    }! Regarding your farm visit request for ${new Date(
      request.requested_date
    ).toLocaleDateString()}, `;
    openWhatsApp(phoneNumber, message);

    if (onMessageSent) {
      onMessageSent("custom", phoneNumber);
    }
  };

  // Don't render if no phone number available
  const visitorPhone = getVisitorPhoneNumber();
  if (!visitorPhone) {
    return null;
  }

  return (
    <div className="d-flex gap-1 flex-nowrap">
      {/* Quick Actions based on status */}
      {request.status === "approved" && (
        <Button
          variant="success"
          size="sm"
          onClick={() => handleSendApprovalMessage(request.admin_notes)}
          title="Send approval message with location details"
        >
          <i className="ti-check"></i>
        </Button>
      )}

      {request.status === "rejected" && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleSendRejectionMessage(request.rejection_reason)}
          title="Send rejection message"
        >
          <i className="ti-close"></i>
        </Button>
      )}

      {request.status === "completed" && (
        <Button
          variant="info"
          size="sm"
          onClick={handleSendCompletedMessage}
          title="Send thank you message"
        >
          <i className="ti-heart"></i>
        </Button>
      )}

      {/* More Actions Dropdown */}
      <Dropdown as={ButtonGroup}>
        <Button
          variant="outline-success"
          size="sm"
          onClick={handleCustomMessage}
          title="Send WhatsApp message"
          className="d-flex align-items-center"
        >
          <img
            src="/images/WhatsApp.svg"
            alt="WhatsApp"
            width="16"
            height="16"
          />
        </Button>

        <Dropdown.Toggle
          split
          variant="outline-success"
          size="sm"
          title="More WhatsApp actions"
        />

        <Dropdown.Menu align="end">
          <Dropdown.Item
            onClick={() => handleSendApprovalMessage(request.admin_notes)}
          >
            <i className="ti-check me-2 text-success"></i>
            Send Approval Message
          </Dropdown.Item>

          <Dropdown.Item
            onClick={() => handleSendRejectionMessage(request.rejection_reason)}
          >
            <i className="ti-close me-2 text-danger"></i>
            Send Rejection Message
          </Dropdown.Item>

          <Dropdown.Item onClick={handleSendCompletedMessage}>
            <i className="ti-heart me-2 text-info"></i>
            Send Thank You Message
          </Dropdown.Item>

          <Dropdown.Divider />

          <Dropdown.Item onClick={handleCustomMessage}>
            <img
              src="/images/WhatsApp.svg"
              alt="WhatsApp"
              width="16"
              height="16"
              className="me-2"
            />
            WhatsApp Message
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
