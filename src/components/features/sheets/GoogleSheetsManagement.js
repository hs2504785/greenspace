"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Badge,
  Table,
  Spinner,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toastService from "@/utils/toastService";
import SimpleGoogleDriveUrlConverter from "@/components/tools/SimpleGoogleDriveUrlConverter";
import { FolderSharingInstructions } from "@/components/tools/GoogleDriveFolderProcessor";

export default function GoogleSheetsManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sheetUrl, setSheetUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [connectedSheets, setConnectedSheets] = useState([]);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [importedProducts, setImportedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchConnectedSheets();
      fetchImportedProducts();
    }
  }, [session]);

  const fetchConnectedSheets = async () => {
    try {
      setSheetsLoading(true);
      const response = await fetch("/api/user-sheets");
      const data = await response.json();

      if (data.success) {
        setConnectedSheets(data.sheets || []);
      }
    } catch (error) {
      console.error("Failed to fetch connected sheets:", error);
    } finally {
      setSheetsLoading(false);
    }
  };

  const fetchImportedProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch("/api/user-sheet-products");
      const data = await response.json();

      if (data.success) {
        setImportedProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch imported products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleConnectToSheet = async () => {
    if (!sheetUrl.trim()) {
      toastService.error("Please enter a Google Sheets URL");
      return;
    }

    if (!session?.user?.email) {
      toastService.error("Please log in to connect sheets");
      return;
    }

    setImportLoading(true);

    try {
      const response = await fetch("/api/connect-sheet-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetUrl: sheetUrl.trim(),
          userEmail: session.user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toastService.success(
          `Successfully connected! Found ${data.productCount} products.`
        );
        setSheetUrl("");
        fetchConnectedSheets();
        fetchImportedProducts();
      } else {
        toastService.error(data.error || "Failed to connect to sheet");
      }
    } catch (error) {
      console.error("Sheet connection error:", error);
      toastService.error("Failed to connect to sheet. Please try again.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportProducts = async (sheetId) => {
    try {
      setImportLoading(true);
      const response = await fetch("/api/import-user-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId,
          userEmail: session.user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toastService.success(
          `Successfully imported ${data.importedCount} products!`
        );
        fetchImportedProducts();
      } else {
        toastService.error(data.error || "Failed to import products");
      }
    } catch (error) {
      console.error("Import error:", error);
      toastService.error("Failed to import products. Please try again.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleDisconnectSheet = async (sheetId) => {
    try {
      const response = await fetch("/api/disconnect-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId,
          userEmail: session.user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toastService.success("Sheet disconnected successfully");
        fetchConnectedSheets();
        fetchImportedProducts();
      } else {
        toastService.error(data.error || "Failed to disconnect sheet");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      toastService.error("Failed to disconnect sheet");
    }
  };

  return (
    <Container className="py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 text-primary mb-1">
            <i className="ti-link me-2"></i>
            Google Sheets Management
          </h1>
          <p className="text-muted mb-0">
            Connect and manage your Google Sheets product listings
          </p>
        </div>
        <Button
          variant="outline-secondary"
          onClick={() => router.push("/products-management")}
        >
          <i className="ti-arrow-left me-2"></i>
          Back to Products
        </Button>
      </div>

      {/* Simplified Approach Alert */}
      <Alert variant="success" className="mb-4">
        <Alert.Heading className="h6">
          🎉 Simplified Image Approach!
        </Alert.Heading>
        <p className="mb-0">
          Share your "Product Images" folder once in Google Drive, and all
          images inside automatically become accessible - no need to share each
          image individually!
        </p>
      </Alert>

      <Row>
        <Col lg={8}>
          {/* Connect New Sheet */}
          <Card className="mb-4 border-success">
            <Card.Header className="bg-success text-white py-2">
              <h5 className="mb-0">
                <i className="ti-plus me-2"></i>
                Connect New Google Sheet
              </h5>
            </Card.Header>
            <Card.Body className="py-3">
              <Form.Group className="mb-3">
                <Form.Label className="text-muted mb-2">
                  🔗 Google Sheets URL (products stay in your sheet):
                </Form.Label>
                <Form.Control
                  type="url"
                  placeholder="Paste your Google Sheets URL..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
                <div className="mt-2 d-flex gap-2 align-items-center">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() =>
                      setSheetUrl(
                        "https://docs.google.com/spreadsheets/d/1ylFr3y8jIVMr1QMFyu81SKDL-HouDaQMHCBRXpGHIU8/edit?usp=sharing"
                      )
                    }
                  >
                    📋 Use Shared Template
                  </Button>
                  <small className="text-muted">or create your own copy</small>
                </div>
              </Form.Group>

              <div className="d-grid">
                <Button
                  variant="success"
                  onClick={handleConnectToSheet}
                  disabled={importLoading || !sheetUrl.trim()}
                >
                  {importLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <i className="ti-link me-2"></i>
                      Connect Sheet
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-3 text-center">
                <small className="text-muted">
                  <a
                    href="https://docs.google.com/spreadsheets/d/1ylFr3y8jIVMr1QMFyu81SKDL-HouDaQMHCBRXpGHIU8/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    📋 View Sample Template
                  </a>
                </small>
              </div>
            </Card.Body>
          </Card>
          {/* Connected Sheets */}
          <Card className="mb-4">
            <Card.Header className="bg-info text-white py-2">
              <h5 className="mb-0">
                <i className="ti-files me-2"></i>
                Connected Sheets ({connectedSheets.length})
              </h5>
            </Card.Header>
            <Card.Body className="py-3">
              {sheetsLoading ? (
                <div className="text-center py-3">
                  <Spinner />
                  <p className="text-muted mt-2">Loading connected sheets...</p>
                </div>
              ) : connectedSheets.length === 0 ? (
                <div className="text-center py-3 text-muted">
                  <i className="ti-file-text" style={{ fontSize: "2rem" }}></i>
                  <p className="mt-2">No sheets connected yet</p>
                  <small>Connect your first Google Sheet above</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Sheet Name</th>
                        <th>Products</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {connectedSheets.map((sheet) => (
                        <tr key={sheet.id}>
                          <td>
                            <div>
                              <strong>{sheet.name || "Untitled Sheet"}</strong>
                              <br />
                              <small className="text-muted">
                                ID: {sheet.sheet_id}
                              </small>
                            </div>
                          </td>
                          <td>
                            <Badge bg="primary">
                              {sheet.product_count || 0}
                            </Badge>
                          </td>
                          <td>
                            <small className="text-muted">
                              {sheet.last_sync
                                ? new Date(sheet.last_sync).toLocaleDateString()
                                : "Never"}
                            </small>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() =>
                                  handleImportProducts(sheet.sheet_id)
                                }
                                disabled={importLoading}
                              >
                                <i className="ti-download me-1"></i>
                                Import
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  handleDisconnectSheet(sheet.sheet_id)
                                }
                              >
                                <i className="ti-unlink me-1"></i>
                                Disconnect
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Imported Products */}
          <Card className="mb-4">
            <Card.Header className="bg-warning text-dark py-2">
              <h5 className="mb-0">
                <i className="ti-package me-2"></i>
                Imported Products ({importedProducts.length})
              </h5>
            </Card.Header>
            <Card.Body className="py-3">
              {productsLoading ? (
                <div className="text-center py-3">
                  <Spinner />
                  <p className="text-muted mt-2">
                    Loading imported products...
                  </p>
                </div>
              ) : importedProducts.length === 0 ? (
                <div className="text-center py-3 text-muted">
                  <i className="ti-package" style={{ fontSize: "2rem" }}></i>
                  <p className="mt-2">No products imported yet</p>
                  <small>Import products from your connected sheets</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Source</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedProducts.slice(0, 10).map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div>
                              <strong>{product.name}</strong>
                              <br />
                              <small className="text-muted">
                                {product.category}
                              </small>
                            </div>
                          </td>
                          <td>
                            ₹{product.price}/{product.unit}
                          </td>
                          <td>
                            {product.quantity} {product.unit}
                          </td>
                          <td>
                            <Badge bg="info">Google Sheets</Badge>
                          </td>
                          <td>
                            <Badge
                              bg={product.available ? "success" : "secondary"}
                            >
                              {product.available ? "Available" : "Out of Stock"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {importedProducts.length > 10 && (
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        Showing 10 of {importedProducts.length} products
                      </small>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Folder Sharing Instructions */}
          <div className="mb-4">
            <FolderSharingInstructions />
          </div>

          {/* URL Converter */}
          <Card className="mb-4 border-warning">
            <Card.Header className="bg-warning text-dark py-2">
              <h6 className="mb-0">
                <i className="ti-link me-2"></i>
                Image URL Converter
              </h6>
            </Card.Header>
            <Card.Body className="py-3">
              <SimpleGoogleDriveUrlConverter />
            </Card.Body>
          </Card>

          {/* Help Links */}
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white py-2">
              <h6 className="mb-0">
                <i className="ti-help me-2"></i>
                Need Help?
              </h6>
            </Card.Header>
            <Card.Body className="py-3">
              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  href="/GOOGLE_DRIVE_IMAGE_GUIDE.md"
                  target="_blank"
                >
                  📖 Image Setup Guide
                </Button>
                <Button
                  variant="outline-info"
                  size="sm"
                  href="/GOOGLE_SHEETS_SETUP.md"
                  target="_blank"
                >
                  Sheets Setup Guide
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  href="/tools/image-url-converter"
                >
                  🔗 Standalone Converter
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
