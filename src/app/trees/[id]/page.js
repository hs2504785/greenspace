"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Form,
  Modal,
  Alert,
  Spinner,
  ButtonGroup,
  OverlayTrigger,
  Tooltip,
  Image,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

export default function TreeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tree, setTree] = useState(null);
  const [careLogs, setCareLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCareModal, setShowCareModal] = useState(false);
  const [careFormData, setCareFormData] = useState({
    activity_type: "",
    description: "",
    notes: "",
  });
  const [careImages, setCareImages] = useState([]);
  const [careImagePreviews, setCareImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [careHistoryViewMode, setCareHistoryViewMode] = useState("cards"); // "cards" or "table"
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const activityTypes = [
    "Watering",
    "Fertilizing",
    "Pruning",
    "Pest Control",
    "Disease Treatment",
    "Harvesting",
    "Soil Testing",
    "Mulching",
    "Transplanting",
    "General Inspection",
  ];

  useEffect(() => {
    if (params.id) {
      fetchTreeDetails();
      fetchCareLogs();
    }
  }, [params.id]);

  const fetchTreeDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trees?id=${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch tree details");

      const trees = await response.json();
      const treeData = trees.find((t) => t.id === params.id);

      if (!treeData) {
        throw new Error("Tree not found");
      }

      setTree(treeData);
    } catch (error) {
      console.error("Error fetching tree details:", error);
      toast.error(error.message);
      router.push("/trees");
    } finally {
      setLoading(false);
    }
  };

  const fetchCareLogs = async () => {
    try {
      const response = await fetch(`/api/tree-care-logs?treeId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCareLogs(data);
      }
    } catch (error) {
      console.error("Error fetching care logs:", error);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 images
    if (careImages.length + files.length > 5) {
      toast.error("Maximum 5 images allowed per care log");
      return;
    }

    setCareImages((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCareImagePreviews((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setCareImages((prev) => prev.filter((_, i) => i !== index));
    setCareImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (careImages.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls = [];

    try {
      // Import the image optimization service directly
      const { imageOptimizationService } = await import(
        "@/services/ImageOptimizationService"
      );
      const { supabase } = await import("@/lib/supabase");

      for (const file of careImages) {
        // Create optimized variants
        const variants = await imageOptimizationService.createImageVariants(
          file
        );

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);

        // Upload the medium variant for tree care logs
        const fileName = `${timestamp}-${randomId}_medium.webp`;
        const filePath = `tree-care/${fileName}`;

        // Convert blob to file for upload
        const optimizedFile = imageOptimizationService.blobToFile(
          variants.medium.blob,
          file.name,
          "medium"
        );

        const { data, error } = await supabase.storage
          .from("images")
          .upload(filePath, optimizedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error("Failed to get public URL");
        }

        uploadedUrls.push(urlData.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw new Error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddCareLog = async (e) => {
    e.preventDefault();

    try {
      // Upload images first if any
      const imageUrls = await uploadImages();

      const response = await fetch("/api/tree-care-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tree_id: params.id,
          ...careFormData,
          images: imageUrls,
        }),
      });

      if (!response.ok) throw new Error("Failed to add care log");

      toast.success("Care log added successfully!");
      setShowCareModal(false);
      setCareFormData({
        activity_type: "",
        description: "",
        notes: "",
      });
      setCareImages([]);
      setCareImagePreviews([]);
      fetchCareLogs();
    } catch (error) {
      console.error("Error adding care log:", error);
      toast.error(error.message);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await fetch("/api/trees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tree.id,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update tree status");

      setTree((prev) => ({ ...prev, status: newStatus }));
      toast.success("Tree status updated successfully!");
    } catch (error) {
      console.error("Error updating tree status:", error);
      toast.error(error.message);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      healthy: "success",
      growing: "info",
      flowering: "warning",
      fruiting: "primary",
      diseased: "danger",
      dormant: "secondary",
    };
    return variants[status] || "secondary";
  };

  const handleImageClick = (imageUrl, log) => {
    setSelectedImage({ url: imageUrl, log });
    setShowImageModal(true);
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      Watering: "💧",
      Fertilizing: "🌱",
      Pruning: "✂️",
      "Pest Control": "🐛",
      "Disease Treatment": "💊",
      Harvesting: "🍎",
      "Soil Testing": "🧪",
      Mulching: "🍂",
      Transplanting: "🌳",
      "General Inspection": "👀",
      "Photo Update": "📸",
    };
    return icons[activityType] || "📝";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const logDate = new Date(dateString);
    const diffInDays = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading tree details...</p>
        </div>
      </Container>
    );
  }

  if (!tree) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Tree Not Found</Alert.Heading>
          <p>The requested tree could not be found.</p>
          <Button variant="primary" onClick={() => router.push("/trees")}>
            Back to Trees
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button
                variant="outline-secondary"
                onClick={() => router.back()}
                className="me-3"
              >
                <i className="bi bi-arrow-left"></i> Back
              </Button>
              <span className="h2">{tree.name}</span>
              <Badge bg="secondary" className="ms-2 fs-6">
                {tree.code}
              </Badge>
            </div>
            <div className="d-flex gap-2">
              <Button variant="success" onClick={() => setShowCareModal(true)}>
                <i className="bi bi-plus-circle"></i> Add Care Log
              </Button>
              <Button variant="outline-primary" href={`/trees`}>
                Edit Tree
              </Button>
            </div>
          </div>

          {/* Care Logs - Full Width */}
          <Row className="mb-4">
            <Col xs={12}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Care History</h5>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    {/* View Mode Toggle */}
                    <ButtonGroup size="sm">
                      <Button
                        variant={
                          careHistoryViewMode === "cards"
                            ? "success"
                            : "outline-success"
                        }
                        onClick={() => setCareHistoryViewMode("cards")}
                      >
                        <i className="ti-layout-list-thumb me-1"></i>
                        Cards
                      </Button>
                      <Button
                        variant={
                          careHistoryViewMode === "table"
                            ? "success"
                            : "outline-success"
                        }
                        onClick={() => setCareHistoryViewMode("table")}
                      >
                        <i className="ti-layout-grid2 me-1"></i>
                        Table
                      </Button>
                    </ButtonGroup>
                    <Badge bg="info">{careLogs.length} records</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  {careLogs.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No care logs recorded yet.</p>
                      <Button
                        variant="success"
                        onClick={() => setShowCareModal(true)}
                      >
                        Add First Care Log
                      </Button>
                    </div>
                  ) : /* Conditional View Rendering */
                  careHistoryViewMode === "cards" ? (
                    /* Card View */
                    <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                      {careLogs.map((log) => (
                        <Card
                          key={log.id}
                          className="mb-3 border-start border-4 border-success"
                        >
                          <Card.Body className="py-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-center">
                                <span
                                  className="me-2"
                                  style={{ fontSize: "1.1rem" }}
                                >
                                  {getActivityIcon(log.activity_type)}
                                </span>
                                <div>
                                  <Badge bg="outline-primary" className="me-2">
                                    {log.activity_type}
                                  </Badge>
                                  <small className="text-muted">
                                    {formatDate(log.performed_at)} •{" "}
                                    {getTimeAgo(log.performed_at)}
                                  </small>
                                </div>
                              </div>
                            </div>
                            {log.description && (
                              <div className="mb-2">
                                <strong>Activity:</strong> {log.description}
                              </div>
                            )}
                            {log.notes && (
                              <div className="text-muted mb-2">
                                <strong>Notes:</strong> {log.notes}
                              </div>
                            )}
                            {log.images && log.images.length > 0 && (
                              <div className="mt-2">
                                <small className="text-muted mb-2 d-block">
                                  <i className="ti-camera me-1"></i>
                                  Photos ({log.images.length}):
                                </small>
                                <Row>
                                  {log.images.map((imageUrl, imgIndex) => (
                                    <Col
                                      xs={6}
                                      md={4}
                                      lg={3}
                                      key={imgIndex}
                                      className="mb-2"
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`${log.activity_type} photo ${
                                          imgIndex + 1
                                        }`}
                                        className="img-thumbnail"
                                        style={{
                                          width: "100%",
                                          height: "80px",
                                          objectFit: "cover",
                                          cursor: "pointer",
                                        }}
                                        onClick={() =>
                                          handleImageClick(imageUrl, log)
                                        }
                                        title="Click to view full size"
                                      />
                                    </Col>
                                  ))}
                                </Row>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    /* Table View */
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "600px", overflowY: "auto" }}
                    >
                      <Table striped hover className="mb-0">
                        <thead className="bg-light sticky-top">
                          <tr>
                            <th style={{ width: "120px" }}>Date</th>
                            <th style={{ width: "120px" }}>Activity</th>
                            <th>Description</th>
                            <th>Notes</th>
                            <th style={{ width: "120px" }}>Photos</th>
                            <th style={{ width: "80px" }}>Age</th>
                          </tr>
                        </thead>
                        <tbody>
                          {careLogs.map((log) => (
                            <tr key={log.id}>
                              <td>
                                <small className="text-muted">
                                  {new Date(
                                    log.performed_at
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "2-digit",
                                  })}
                                  <br />
                                  {new Date(
                                    log.performed_at
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </small>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span
                                    className="me-1"
                                    style={{ fontSize: "14px" }}
                                  >
                                    {getActivityIcon(log.activity_type)}
                                  </span>
                                  <Badge
                                    bg="outline-success"
                                    className="text-truncate"
                                    style={{
                                      maxWidth: "90px",
                                      fontSize: "10px",
                                    }}
                                    title={log.activity_type}
                                  >
                                    {log.activity_type}
                                  </Badge>
                                </div>
                              </td>
                              <td>
                                <div
                                  className="text-truncate"
                                  style={{ maxWidth: "200px" }}
                                  title={log.description}
                                >
                                  {log.description || "-"}
                                </div>
                              </td>
                              <td>
                                <div
                                  className="text-truncate text-muted"
                                  style={{ maxWidth: "150px" }}
                                  title={log.notes}
                                >
                                  {log.notes || "-"}
                                </div>
                              </td>
                              <td>
                                {log.images && log.images.length > 0 ? (
                                  <div className="d-flex gap-1">
                                    {log.images
                                      .slice(0, 3)
                                      .map((imageUrl, imgIndex) => (
                                        <Image
                                          key={imgIndex}
                                          src={imageUrl}
                                          alt={`Photo ${imgIndex + 1}`}
                                          className="img-thumbnail"
                                          style={{
                                            width: "30px",
                                            height: "30px",
                                            objectFit: "cover",
                                            cursor: "pointer",
                                          }}
                                          onClick={() =>
                                            handleImageClick(imageUrl, log)
                                          }
                                          title="Click to view full size"
                                        />
                                      ))}
                                    {log.images.length > 3 && (
                                      <div
                                        className="d-flex align-items-center justify-content-center bg-light border rounded"
                                        style={{
                                          width: "30px",
                                          height: "30px",
                                          fontSize: "10px",
                                          cursor: "pointer",
                                        }}
                                        onClick={() =>
                                          handleImageClick(log.images[3], log)
                                        }
                                        title={`+${
                                          log.images.length - 3
                                        } more photos`}
                                      >
                                        +{log.images.length - 3}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                <small className="text-muted">
                                  {getTimeAgo(log.performed_at)}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tree Information - Below Care Logs */}
          <Row>
            <Col xs={12}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="ti-info me-2"></i>
                    Tree Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {/* Basic Info */}
                    <Col md={6} lg={3}>
                      <div className="mb-3">
                        <strong>Status:</strong>
                        <div className="mt-1">
                          <Badge
                            bg={getStatusBadgeVariant(tree.status)}
                            className="me-2"
                          >
                            {tree.status}
                          </Badge>
                          <Form.Select
                            size="sm"
                            style={{ width: "auto", display: "inline-block" }}
                            value={tree.status}
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                          >
                            <option value="healthy">Healthy</option>
                            <option value="growing">Growing</option>
                            <option value="flowering">Flowering</option>
                            <option value="fruiting">Fruiting</option>
                            <option value="diseased">Diseased</option>
                            <option value="dormant">Dormant</option>
                          </Form.Select>
                        </div>
                      </div>

                      {tree.scientific_name && (
                        <div className="mb-3">
                          <strong>Scientific Name:</strong>
                          <div className="text-muted">
                            {tree.scientific_name}
                          </div>
                        </div>
                      )}

                      {tree.variety && (
                        <div className="mb-3">
                          <strong>Variety:</strong>
                          <div>{tree.variety}</div>
                        </div>
                      )}
                    </Col>

                    {/* Dates */}
                    <Col md={6} lg={3}>
                      {tree.planting_date && (
                        <div className="mb-3">
                          <strong>Planting Date:</strong>
                          <div>
                            {new Date(tree.planting_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {tree.expected_harvest_date && (
                        <div className="mb-3">
                          <strong>Expected Harvest:</strong>
                          <div>
                            {new Date(
                              tree.expected_harvest_date
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <strong>Created:</strong>
                        <div className="text-muted">
                          {new Date(tree.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Col>

                    {/* Farm Position */}
                    <Col md={6} lg={3}>
                      {tree.tree_positions &&
                        tree.tree_positions.length > 0 && (
                          <div className="mb-3">
                            <strong>Farm Position:</strong>
                            {tree.tree_positions.map((pos, index) => (
                              <div key={index} className="text-muted">
                                Block {pos.block_index + 1}, Grid ({pos.grid_x},{" "}
                                {pos.grid_y})
                              </div>
                            ))}
                          </div>
                        )}
                    </Col>

                    {/* Description */}
                    <Col md={6} lg={3}>
                      {tree.description && (
                        <div className="mb-3">
                          <strong>Description:</strong>
                          <div className="text-muted">{tree.description}</div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Add Care Log Modal */}
      <Modal
        show={showCareModal}
        onHide={() => setShowCareModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Care Log</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddCareLog}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Activity Type *</Form.Label>
                  <Form.Select
                    value={careFormData.activity_type}
                    onChange={(e) =>
                      setCareFormData((prev) => ({
                        ...prev,
                        activity_type: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select activity type...</option>
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    type="text"
                    value={careFormData.description}
                    onChange={(e) =>
                      setCareFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of the activity"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={careFormData.notes}
                onChange={(e) =>
                  setCareFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Any additional observations, measurements, or notes..."
              />
            </Form.Group>

            {/* Image Upload Section */}
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="ti-camera me-2"></i>
                Photos (Optional - Max 5)
              </Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="mb-3"
              />

              {/* Image Previews */}
              {careImagePreviews.length > 0 && (
                <div className="image-previews">
                  <small className="text-muted mb-2 d-block">
                    Selected images ({careImagePreviews.length}/5):
                  </small>
                  <Row>
                    {careImagePreviews.map((preview, index) => (
                      <Col xs={6} md={4} lg={3} key={index} className="mb-2">
                        <div className="position-relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="img-thumbnail"
                            style={{
                              width: "100%",
                              height: "80px",
                              objectFit: "cover",
                            }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0"
                            style={{
                              transform: "translate(25%, -25%)",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              padding: "0",
                              fontSize: "12px",
                            }}
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              <small className="text-muted">
                <i className="ti-info-alt me-1"></i>
                Add photos to document tree growth and changes over time
              </small>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCareModal(false)}
              disabled={uploadingImages}
            >
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={uploadingImages}>
              {uploadingImages ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Uploading Images...
                </>
              ) : (
                <>
                  <i className="ti-plus me-1"></i>
                  Add Care Log
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Full Size Image Modal */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            {selectedImage?.log?.activity_type} -{" "}
            {selectedImage?.log
              ? formatDate(selectedImage.log.performed_at)
              : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-dark text-center">
          {selectedImage && (
            <Image
              src={selectedImage.url}
              alt="Tree photo full size"
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
              }}
            />
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-0">
          {selectedImage?.log?.description && (
            <div className="text-white w-100 text-center">
              <small>{selectedImage.log.description}</small>
            </div>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
