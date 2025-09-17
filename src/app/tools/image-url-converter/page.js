"use client";

import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import SimpleGoogleDriveUrlConverter from "@/components/tools/SimpleGoogleDriveUrlConverter";
import { FolderSharingInstructions } from "@/components/tools/GoogleDriveFolderProcessor";

export default function ImageUrlConverterPage() {
  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          {/* Page Header */}
          <div className="text-center mb-4">
            <h1 className="h3 text-primary mb-2">
              📸 Google Drive Image URL Converter
            </h1>
            <p className="text-muted">
              Convert Google Drive sharing URLs to direct image URLs for use in
              Google Sheets
            </p>
          </div>

          {/* Simplified Approach Alert */}
          <Alert variant="success" className="mb-4">
            <Alert.Heading className="h6">
              🎉 Simplified Approach - Share Folder Once!
            </Alert.Heading>
            <p className="mb-0">
              You don't need to share each image individually. Share your
              "Product Images" folder once, and all images inside automatically
              become accessible!
            </p>
          </Alert>

          {/* Folder Sharing Instructions */}
          <div className="mb-4">
            <FolderSharingInstructions />
          </div>

          {/* URL Converter Tool */}
          <Card className="mb-4 border-success">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="ti-link me-2"></i>
                URL Converter Tool
              </h5>
            </Card.Header>
            <Card.Body>
              <SimpleGoogleDriveUrlConverter />
            </Card.Body>
          </Card>

          {/* Quick Guide */}
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <i className="ti-info-circle me-2"></i>
                Quick Guide
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-primary">📁 One-Time Folder Setup:</h6>
                  <ol className="small">
                    <li>Create "Product Images" folder in Google Drive</li>
                    <li>
                      <strong>Share folder</strong> publicly ("Anyone with link
                      can view")
                    </li>
                    <li>Upload all your product images</li>
                  </ol>
                </Col>
                <Col md={6}>
                  <h6 className="text-success">🔗 For Each Image:</h6>
                  <ol className="small">
                    <li>Right-click image → "Get link"</li>
                    <li>Paste URL in converter above</li>
                    <li>Copy the direct URL</li>
                    <li>Add to your Google Sheet</li>
                  </ol>
                </Col>
              </Row>

              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="text-warning mb-2">
                  <i className="ti-lightbulb me-2"></i>
                  Example Conversion:
                </h6>
                <div className="mb-2">
                  <small className="text-muted">Input (Sharing URL):</small>
                  <code className="d-block small">
                    https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
                  </code>
                </div>
                <div className="text-center my-2">
                  <i className="text-primary">↓ Converts to ↓</i>
                </div>
                <div>
                  <small className="text-muted">
                    Output (Direct URL for Google Sheet):
                  </small>
                  <code className="d-block small text-success">
                    https://drive.google.com/uc?export=view&id=1ABC123xyz
                  </code>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Help Links */}
          <div className="text-center mt-4">
            <p className="text-muted small">
              Need more help? Check out our{" "}
              <a
                href="/GOOGLE_DRIVE_IMAGE_GUIDE.md"
                target="_blank"
                className="text-decoration-none"
              >
                📖 Complete Google Drive Image Guide
              </a>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
