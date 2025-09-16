"use client";

import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  Button,
  Form,
  Modal,
  Badge,
} from "react-bootstrap";
import {
  FaGoogle,
  FaDownload,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaUpload,
  FaInfoCircle,
} from "react-icons/fa";

export default function BecomeSellerPage() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Template Google Sheets URL (you'll need to create this)
  const templateSheetUrl =
    "https://docs.google.com/spreadsheets/d/1EXAMPLE_TEMPLATE_ID/edit#gid=0";

  // Sample spreadsheet ID for validation
  const sampleSpreadsheetId = "1EXAMPLE_SAMPLE_ID";

  const handleCopyText = (text, identifier) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const validateSpreadsheet = async (spreadsheetId) => {
    if (!spreadsheetId) return;

    setIsValidating(true);
    try {
      const response = await fetch(
        `/api/external-products?validate=true&spreadsheetId=${spreadsheetId}`
      );
      const data = await response.json();
      setValidationResult(data);
    } catch (error) {
      setValidationResult({
        success: false,
        error: error.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const TemplateInstructions = () => (
    <Card className="mb-4 border-success">
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">
          <FaGoogle className="me-2" />
          How to Create Your Product Listing Sheet
        </h5>
      </Card.Header>
      <Card.Body>
        <div className="step-instructions">
          <div className="mb-4">
            <h6 className="text-success">Step 1: Copy Our Template</h6>
            <p>
              Start with our pre-made template that has all the right columns:
            </p>
            <Button
              variant="success"
              href={templateSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="me-2 mb-2"
            >
              <FaGoogle className="me-2" />
              Open Template Sheet
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => setShowInstructionsModal(true)}
              className="mb-2"
            >
              <FaInfoCircle className="me-2" />
              Detailed Instructions
            </Button>
          </div>

          <div className="mb-4">
            <h6 className="text-success">Step 2: Make Your Own Copy</h6>
            <ol>
              <li>Click "File" → "Make a copy" in Google Sheets</li>
              <li>Give your sheet a name like "My Farm Products"</li>
              <li>Make sure it's set to "Anyone with the link can view"</li>
            </ol>
          </div>

          <div className="mb-4">
            <h6 className="text-success">Step 3: Add Your Products</h6>
            <p>Fill in your products using these columns:</p>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Column</th>
                    <th>Required</th>
                    <th>Example</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Name</strong>
                    </td>
                    <td>
                      <Badge bg="danger">Required</Badge>
                    </td>
                    <td>Fresh Tomatoes</td>
                    <td>Product name</td>
                  </tr>
                  <tr>
                    <td>Description</td>
                    <td>
                      <Badge bg="secondary">Optional</Badge>
                    </td>
                    <td>Organic red tomatoes, freshly harvested</td>
                    <td>Product details</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Price</strong>
                    </td>
                    <td>
                      <Badge bg="danger">Required</Badge>
                    </td>
                    <td>50</td>
                    <td>Price per unit (₹)</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Quantity</strong>
                    </td>
                    <td>
                      <Badge bg="danger">Required</Badge>
                    </td>
                    <td>10</td>
                    <td>Available quantity</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Category</strong>
                    </td>
                    <td>
                      <Badge bg="danger">Required</Badge>
                    </td>
                    <td>Vegetables</td>
                    <td>Vegetables, Fruits, Herbs, etc.</td>
                  </tr>
                  <tr>
                    <td>Unit</td>
                    <td>
                      <Badge bg="secondary">Optional</Badge>
                    </td>
                    <td>kg</td>
                    <td>kg, pieces, bundles, etc.</td>
                  </tr>
                  <tr>
                    <td>Location</td>
                    <td>
                      <Badge bg="warning">Recommended</Badge>
                    </td>
                    <td>Hyderabad, Telangana</td>
                    <td>Your city/area</td>
                  </tr>
                  <tr>
                    <td>Images</td>
                    <td>
                      <Badge bg="secondary">Optional</Badge>
                    </td>
                    <td>https://example.com/image1.jpg</td>
                    <td>Comma-separated URLs</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Contact Name</strong>
                    </td>
                    <td>
                      <Badge bg="danger">Required</Badge>
                    </td>
                    <td>Ramesh Kumar</td>
                    <td>Your name</td>
                  </tr>
                  <tr>
                    <td>Contact Phone</td>
                    <td>
                      <Badge bg="warning">Recommended</Badge>
                    </td>
                    <td>9876543210</td>
                    <td>Your phone number</td>
                  </tr>
                  <tr>
                    <td>Contact WhatsApp</td>
                    <td>
                      <Badge bg="warning">Recommended</Badge>
                    </td>
                    <td>9876543210</td>
                    <td>WhatsApp number</td>
                  </tr>
                  <tr>
                    <td>Organic</td>
                    <td>
                      <Badge bg="secondary">Optional</Badge>
                    </td>
                    <td>Yes</td>
                    <td>Yes/No or True/False</td>
                  </tr>
                  <tr>
                    <td>Harvest Date</td>
                    <td>
                      <Badge bg="secondary">Optional</Badge>
                    </td>
                    <td>2025-09-15</td>
                    <td>When harvested</td>
                  </tr>
                  <tr>
                    <td>Notes</td>
                    <td>
                      <Badge bg="secondary">Optional</Badge>
                    </td>
                    <td>Available for pickup only</td>
                    <td>Additional info</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <h6 className="text-success">Step 4: Share Your Sheet</h6>
            <ol>
              <li>Click the "Share" button in your Google Sheet</li>
              <li>Change access to "Anyone with the link can view"</li>
              <li>Copy the share link</li>
              <li>Send us the link using the form below</li>
            </ol>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const ValidationForm = () => {
    const [spreadsheetId, setSpreadsheetId] = useState("");

    const extractSpreadsheetId = (url) => {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : url;
    };

    const handleValidate = () => {
      const id = extractSpreadsheetId(spreadsheetId);
      validateSpreadsheet(id);
    };

    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <FaCheck className="me-2" />
            Test Your Google Sheet
          </h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Google Sheets URL or ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="Paste your Google Sheets URL here..."
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
              />
              <Form.Text className="text-muted">
                You can paste the full URL or just the spreadsheet ID
              </Form.Text>
            </Form.Group>
            <Button
              variant="primary"
              onClick={handleValidate}
              disabled={!spreadsheetId || isValidating}
            >
              {isValidating ? "Validating..." : "Validate Sheet"}
            </Button>
          </Form>

          {validationResult && (
            <Alert
              variant={validationResult.success ? "success" : "danger"}
              className="mt-3"
            >
              {validationResult.success ? (
                <div>
                  <h6>✅ Sheet looks good!</h6>
                  {validationResult.validation?.isValid ? (
                    <p>Your sheet structure is correct and ready to use.</p>
                  ) : (
                    <div>
                      <p>Sheet structure needs some adjustments:</p>
                      <ul>
                        {validationResult.validation?.suggestions?.map(
                          (suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h6>❌ Validation Failed</h6>
                  <p>{validationResult.error}</p>
                </div>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8} className="mx-auto">
          <div className="text-center mb-5">
            <h1 className="display-4 text-success mb-3">Become a Seller</h1>
            <p className="lead">
              Join our marketplace and start selling your fresh produce to local
              customers. List your products using Google Sheets - it's simple
              and free!
            </p>
          </div>

          <Alert variant="info" className="mb-4">
            <FaInfoCircle className="me-2" />
            <strong>No Registration Required!</strong> Simply create a Google
            Sheet with your products and we'll automatically include them in our
            marketplace. Update your sheet anytime to manage your inventory.
          </Alert>

          <TemplateInstructions />
          <ValidationForm />

          {/* Benefits Section */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Why Sell With Us?</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      ✅ <strong>Free to use</strong> - No registration fees
                    </li>
                    <li className="mb-2">
                      ✅ <strong>Easy updates</strong> - Just edit your Google
                      Sheet
                    </li>
                    <li className="mb-2">
                      ✅ <strong>Reach local customers</strong> - Connect with
                      nearby buyers
                    </li>
                    <li className="mb-2">
                      ✅ <strong>No technical skills needed</strong> - Simple
                      spreadsheet format
                    </li>
                  </ul>
                </Col>
                <Col md={6}>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      ✅ <strong>Instant updates</strong> - Changes appear
                      within minutes
                    </li>
                    <li className="mb-2">
                      ✅ <strong>Mobile friendly</strong> - Customers can find
                      you on any device
                    </li>
                    <li className="mb-2">
                      ✅ <strong>Direct contact</strong> - Customers contact you
                      directly
                    </li>
                    <li className="mb-2">
                      ✅ <strong>Keep your data</strong> - You own your product
                      information
                    </li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Support Section */}
          <Card className="mb-4 border-primary">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Need Help?</h5>
            </Card.Header>
            <Card.Body>
              <p>
                We're here to help you get started! If you have any questions or
                need assistance setting up your product sheet, please don't
                hesitate to reach out.
              </p>
              <Button variant="primary" className="me-2">
                Contact Support
              </Button>
              <Button variant="outline-primary">Watch Tutorial Video</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Instructions Modal */}
      <Modal
        show={showInstructionsModal}
        onHide={() => setShowInstructionsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detailed Setup Instructions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="instructions-content">
            <h6>Step-by-Step Setup Guide</h6>

            <div className="mb-4">
              <h6 className="text-primary">1. Create Your Google Sheet</h6>
              <ol>
                <li>
                  Go to{" "}
                  <a
                    href="https://sheets.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Sheets
                  </a>
                </li>
                <li>Click "Blank" to create a new spreadsheet</li>
                <li>Name your sheet (e.g., "My Farm Products 2025")</li>
              </ol>
            </div>

            <div className="mb-4">
              <h6 className="text-primary">2. Set Up Your Columns</h6>
              <p>
                In the first row (header row), add these column names exactly as
                shown:
              </p>
              <div className="bg-light p-3 rounded font-monospace">
                Name | Description | Price | Quantity | Category | Unit |
                Location | Images | Contact Name | Contact Phone | Contact
                WhatsApp | Organic | Harvest Date | Notes
              </div>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() =>
                  handleCopyText(
                    "Name\tDescription\tPrice\tQuantity\tCategory\tUnit\tLocation\tImages\tContact Name\tContact Phone\tContact WhatsApp\tOrganic\tHarvest Date\tNotes",
                    "headers"
                  )
                }
                className="mt-2"
              >
                {copiedText === "headers" ? <FaCheck /> : <FaCopy />} Copy
                Headers
              </Button>
            </div>

            <div className="mb-4">
              <h6 className="text-primary">3. Add Sample Data</h6>
              <p>Here's an example row to get you started:</p>
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <tbody>
                    <tr>
                      <td>Fresh Tomatoes</td>
                      <td>Organic red tomatoes</td>
                      <td>50</td>
                      <td>10</td>
                      <td>Vegetables</td>
                      <td>kg</td>
                      <td>Hyderabad</td>
                      <td></td>
                      <td>Your Name</td>
                      <td>9876543210</td>
                      <td>9876543210</td>
                      <td>Yes</td>
                      <td>2025-09-15</td>
                      <td>Fresh harvest</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h6 className="text-primary">4. Make It Public</h6>
              <ol>
                <li>Click the "Share" button (top right)</li>
                <li>Under "General access", select "Anyone with the link"</li>
                <li>Make sure it's set to "Viewer"</li>
                <li>Click "Copy link"</li>
              </ol>
            </div>

            <div className="mb-4">
              <h6 className="text-primary">5. Test Your Sheet</h6>
              <p>
                Use the validation tool above to make sure everything is set up
                correctly.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowInstructionsModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
