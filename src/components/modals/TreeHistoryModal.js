"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Alert,
  Image,
  OverlayTrigger,
  Tooltip,
  Table,
  ButtonGroup,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

const TreeHistoryModal = ({ show, onHide, selectedTree, selectedPosition }) => {
  const [careLogs, setCareLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" or "table"

  useEffect(() => {
    if (show && selectedTree?.tree_id) {
      fetchTreeHistory();
    }
  }, [show, selectedTree?.tree_id]);

  const fetchTreeHistory = async () => {
    if (!selectedTree?.tree_id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/tree-care-logs?treeId=${selectedTree.tree_id}`
      );
      if (!response.ok) throw new Error("Failed to fetch tree history");

      const data = await response.json();
      // For now, only show logs that have images (can be changed later)
      const logsWithImages = data.filter(
        (log) => log.images && log.images.length > 0
      );
      setCareLogs(logsWithImages);
    } catch (error) {
      console.error("Error fetching tree history:", error);
      toast.error("Failed to load tree history");
    } finally {
      setLoading(false);
    }
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

  if (!selectedTree) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="d-flex align-items-center">
            <span className="me-3" style={{ fontSize: "1.5rem" }}>
              📸
            </span>
            <div>
              <h4 className="mb-0">Tree Growth History</h4>
              <small className="opacity-75">
                {selectedTree.name} ({selectedTree.code}) - Block{" "}
                {(selectedPosition?.blockIndex || 0) + 1}
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          className="p-4"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3 text-muted">Loading tree history...</p>
            </div>
          ) : careLogs.length === 0 ? (
            <Alert variant="info" className="text-center">
              <div className="mb-3">
                <i
                  className="ti-camera"
                  style={{ fontSize: "3rem", opacity: 0.5 }}
                ></i>
              </div>
              <h5>No Photo History Available</h5>
              <p className="mb-3">
                This tree doesn't have any care logs with photos yet. Start
                documenting your tree's growth by adding care logs with images!
              </p>
              <Button
                variant="success"
                href={`/trees/${selectedTree.tree_id}`}
                className="me-2"
              >
                <i className="ti-plus me-1"></i>
                Add Care Log
              </Button>
              <Button variant="outline-primary" onClick={onHide}>
                Close
              </Button>
            </Alert>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="mb-0">
                    <i className="ti-time me-2 text-success"></i>
                    Growth Timeline ({careLogs.length} entries with photos)
                  </h5>
                </div>
                <div className="d-flex align-items-center gap-3">
                  {/* View Mode Toggle */}
                  <ButtonGroup size="sm">
                    <Button
                      variant={
                        viewMode === "timeline" ? "success" : "outline-success"
                      }
                      onClick={() => setViewMode("timeline")}
                    >
                      <i className="ti-layout-list-thumb me-1"></i>
                      Timeline
                    </Button>
                    <Button
                      variant={
                        viewMode === "table" ? "success" : "outline-success"
                      }
                      onClick={() => setViewMode("table")}
                    >
                      <i className="ti-layout-grid2 me-1"></i>
                      Table
                    </Button>
                  </ButtonGroup>
                  <Badge bg="success" className="fs-6">
                    {selectedTree.name}
                  </Badge>
                </div>
              </div>

              {/* Conditional View Rendering */}
              {viewMode === "timeline" ? (
                /* Timeline View */
                <div className="timeline-container">
                  {careLogs.map((log, index) => (
                    <div key={log.id} className="timeline-item mb-4">
                      <Card className="border-0 shadow-sm">
                        <Card.Body className="p-3">
                          <Row>
                            <Col md={8}>
                              {/* Log Info */}
                              <div className="d-flex align-items-center mb-2">
                                <span
                                  className="me-2"
                                  style={{ fontSize: "1.2rem" }}
                                >
                                  {getActivityIcon(log.activity_type)}
                                </span>
                                <div>
                                  <h6 className="mb-0">{log.activity_type}</h6>
                                  <small className="text-muted">
                                    {formatDate(log.performed_at)} •{" "}
                                    {getTimeAgo(log.performed_at)}
                                  </small>
                                </div>
                              </div>

                              {log.description && (
                                <p className="mb-2 text-muted">
                                  {log.description}
                                </p>
                              )}

                              {log.notes && (
                                <div className="mb-2">
                                  <small className="text-muted">
                                    <strong>Notes:</strong> {log.notes}
                                  </small>
                                </div>
                              )}
                            </Col>

                            <Col md={4}>
                              {/* Images Gallery */}
                              <div className="images-grid">
                                {log.images.map((imageUrl, imgIndex) => (
                                  <div
                                    key={imgIndex}
                                    className="image-thumbnail-container position-relative mb-2"
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                      handleImageClick(imageUrl, log)
                                    }
                                  >
                                    <OverlayTrigger
                                      placement="top"
                                      overlay={
                                        <Tooltip>
                                          Click to view full size
                                        </Tooltip>
                                      }
                                    >
                                      <Image
                                        src={imageUrl}
                                        alt={`Tree photo ${imgIndex + 1}`}
                                        className="img-thumbnail"
                                        style={{
                                          width: "100%",
                                          height: "120px",
                                          objectFit: "cover",
                                          borderRadius: "8px",
                                          transition: "transform 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.transform =
                                            "scale(1.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.transform = "scale(1)";
                                        }}
                                      />
                                    </OverlayTrigger>

                                    {/* Image overlay with expand icon */}
                                    <div
                                      className="position-absolute top-0 end-0 m-1"
                                      style={{
                                        backgroundColor: "rgba(0,0,0,0.7)",
                                        borderRadius: "50%",
                                        width: "24px",
                                        height: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <i
                                        className="ti-zoom-in text-white"
                                        style={{ fontSize: "12px" }}
                                      ></i>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>

                      {/* Timeline connector (except for last item) */}
                      {index < careLogs.length - 1 && (
                        <div className="timeline-connector text-center my-3">
                          <div
                            style={{
                              width: "2px",
                              height: "30px",
                              backgroundColor: "#28a745",
                              margin: "0 auto",
                              opacity: 0.3,
                            }}
                          ></div>
                          <i
                            className="ti-arrow-down text-success"
                            style={{ fontSize: "12px" }}
                          ></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="table-responsive">
                  <Table striped hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: "120px" }}>Date</th>
                        <th style={{ width: "100px" }}>Activity</th>
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
                              {new Date(log.performed_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "2-digit",
                                }
                              )}
                              <br />
                              {new Date(log.performed_at).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
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
                                style={{ maxWidth: "80px", fontSize: "10px" }}
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
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div>
              <small className="text-muted">
                <i className="ti-info-alt me-1"></i>
                Showing {careLogs.length} entries with photos •{" "}
                {viewMode === "timeline" ? "Timeline" : "Table"} view
              </small>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={onHide}>
                <i className="ti-close me-1"></i>
                Close
              </Button>
              <Button variant="success" href={`/trees/${selectedTree.tree_id}`}>
                <i className="ti-plus me-1"></i>
                Add New Entry
              </Button>
            </div>
          </div>
        </Modal.Footer>
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
            {formatDate(selectedImage?.log?.performed_at)}
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
    </>
  );
};

export default TreeHistoryModal;
