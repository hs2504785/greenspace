"use client";

import { Container, Row, Col } from "react-bootstrap";
import InfoNotice from "@/components/common/InfoNotice";

// This is just an example file to show how to use InfoNotice component
export default function InfoNoticeExamples() {
  return (
    <Container className="py-4">
      <h3 className="mb-4">InfoNotice Component Examples</h3>

      <Row className="g-4">
        <Col md={6}>
          <InfoNotice variant="success" title="Order Confirmed">
            Your order has been successfully confirmed and is being processed.
          </InfoNotice>
        </Col>

        <Col md={6}>
          <InfoNotice
            variant="info"
            title="Order Sent to Seller"
            icon="ti-brand-whatsapp"
          >
            Your order has been sent to the seller via WhatsApp. They will
            contact you shortly.
          </InfoNotice>
        </Col>

        <Col md={6}>
          <InfoNotice variant="warning" title="Payment Pending">
            Please complete your payment to proceed with the order.
          </InfoNotice>
        </Col>

        <Col md={6}>
          <InfoNotice variant="danger" title="Order Cancelled">
            This order has been cancelled due to unavailability of items.
          </InfoNotice>
        </Col>

        <Col md={6}>
          <InfoNotice variant="help" title="Guest Order" icon="ti-user">
            Order placed without account. Details saved securely.
          </InfoNotice>
        </Col>

        <Col md={6}>
          <InfoNotice variant="info" title="Helpful Tip" icon="ti-lightbulb">
            You can track your order status in real-time through our dashboard.
          </InfoNotice>
        </Col>
      </Row>
    </Container>
  );
}
