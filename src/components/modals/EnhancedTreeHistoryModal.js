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
  Nav,
  Tab,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

const EnhancedTreeHistoryModal = ({
  show,
  onHide,
  selectedTree,
  selectedPosition,
}) => {
  const [careLogs, setCareLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" or "table"
  const [activeTab, setActiveTab] = useState("history"); // "history" or "location"
  const [locationData, setLocationData] = useState(null);

  useEffect(() => {
    console.log("Modal state changed:", {
      show,
      selectedTree,
      selectedPosition,
      hasTreeId: Boolean(selectedTree?.tree_id),
      hasPositionId: Boolean(selectedPosition?.id),
      hasGPS: Boolean(
        selectedPosition?.latitude && selectedPosition?.longitude
      ),
    });

    if (show) {
      if (selectedTree?.tree_id) {
        fetchTreeHistory();
      }
      // Always try to fetch location data when modal shows
      fetchLocationData();
    }
  }, [show, selectedTree?.tree_id, selectedTree, selectedPosition]);

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

  const fetchLocationData = async () => {
    // Try to get position ID from different sources
    let positionId = null;

    if (selectedPosition?.id) {
      positionId = selectedPosition.id;
    } else if (
      selectedTree?.tree_positions &&
      selectedTree.tree_positions.length > 0
    ) {
      positionId = selectedTree.tree_positions[0].id;
    } else if (selectedTree?.id && selectedTree?.grid_x !== undefined) {
      positionId = selectedTree.id;
    }

    if (!positionId) {
      console.log("No position ID found to fetch location data");
      // If we have GPS data directly in selectedTree or selectedPosition, use that
      if (selectedPosition?.latitude && selectedPosition?.longitude) {
        setLocationData(selectedPosition);
      } else if (selectedTree?.latitude && selectedTree?.longitude) {
        setLocationData(selectedTree);
      }
      return;
    }

    try {
      console.log("Fetching location data for position:", positionId);
      const response = await fetch(`/api/tree-positions/${positionId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Location data fetched:", data);
        setLocationData(data);
      } else {
        console.error("Failed to fetch location data:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
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
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      watering: "💧",
      fertilizing: "🌱",
      pruning: "✂️",
      "pest control": "🐛",
      "disease treatment": "💊",
      harvesting: "🍎",
      "soil testing": "🧪",
      mulching: "🍂",
      transplanting: "🌿",
      "general inspection": "👁️",
    };
    return icons[activityType?.toLowerCase()] || "📝";
  };

  const renderLocationInfo = () => {
    console.log("Rendering location info with data:", locationData);

    if (!locationData) {
      console.log("No location data available");
      return (
        <div className="p-4">
          <Alert variant="info">
            <Alert.Heading className="h6">
              <i className="ti-info-circle me-2"></i>
              No Location Data
            </Alert.Heading>
            <p className="mb-0">
              Location information is not available for this tree position.
            </p>
          </Alert>
        </div>
      );
    }

    const hasGPS = locationData.latitude && locationData.longitude;
    console.log("Has GPS coordinates:", hasGPS, {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });

    return (
      <div className="p-4">
        <Row>
          <Col md={6}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body>
                <h6 className="text-primary mb-3">
                  <i className="ti-location-pin me-2"></i>
                  Grid Position
                </h6>
                <div className="mb-2">
                  <strong>Block:</strong> {locationData.block_index + 1}
                </div>
                <div className="mb-2">
                  <strong>Grid Coordinates:</strong> ({locationData.grid_x},{" "}
                  {locationData.grid_y})
                </div>
                <div className="mb-2">
                  <strong>Planted:</strong>{" "}
                  {formatDate(locationData.planted_at)}
                </div>
                {locationData.variety && (
                  <div className="mb-2">
                    <strong>Variety:</strong> {locationData.variety}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body>
                <h6 className="text-success mb-3">
                  <i className="ti-world me-2"></i>
                  GPS Location {hasGPS ? "✅" : "❌"}
                </h6>
                {hasGPS ? (
                  <>
                    <div className="mb-2">
                      <strong>Latitude:</strong> {locationData.latitude}°N
                    </div>
                    <div className="mb-2">
                      <strong>Longitude:</strong> {locationData.longitude}°E
                    </div>
                    {locationData.altitude && (
                      <div className="mb-2">
                        <strong>Altitude:</strong> {locationData.altitude}m
                      </div>
                    )}
                    {locationData.gps_accuracy && (
                      <div className="mb-2">
                        <strong>Accuracy:</strong> ±{locationData.gps_accuracy}m
                        <Badge
                          bg={
                            locationData.gps_accuracy < 5
                              ? "success"
                              : locationData.gps_accuracy < 15
                              ? "warning"
                              : "secondary"
                          }
                          className="ms-2"
                        >
                          {locationData.gps_accuracy < 5
                            ? "High"
                            : locationData.gps_accuracy < 15
                            ? "Medium"
                            : "Low"}
                        </Badge>
                      </div>
                    )}
                    {locationData.coordinates_captured_at && (
                      <div className="mb-2">
                        <strong>Captured:</strong>{" "}
                        {formatDate(locationData.coordinates_captured_at)}
                      </div>
                    )}
                    <div className="mt-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          const url = `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`;
                          window.open(url, "_blank");
                        }}
                      >
                        <i className="ti-map me-1"></i>
                        View on Map
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-muted">
                    <p>GPS coordinates not available for this tree.</p>
                    <small>
                      Consider adding GPS coordinates for:
                      <ul className="mt-2">
                        <li>Precise location tracking</li>
                        <li>Integration with mapping services</li>
                        <li>Environmental data correlation</li>
                        <li>Regulatory compliance</li>
                      </ul>
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {hasGPS && (
          <Row className="mt-4">
            <Col>
              <Card className="border-0 bg-info bg-opacity-10">
                <Card.Body>
                  <h6 className="text-info mb-3">
                    <i className="ti-stats-up me-2"></i>
                    Geotagging Benefits
                  </h6>
                  <Row>
                    <Col md={3}>
                      <div className="text-center">
                        <div className="text-success fs-4">🎯</div>
                        <small>
                          <strong>Precision</strong>
                          <br />
                          Exact location tracking
                        </small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div
                        className="text-center"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          window.open(
                            "/geotagging-benefits?tab=weather",
                            "_blank"
                          )
                        }
                      >
                        <div className="text-primary fs-4">🌡️</div>
                        <small>
                          <strong>Weather</strong>
                          <br />
                          Location-specific data
                          <br />
                          <Badge bg="info" className="mt-1">
                            Learn More
                          </Badge>
                        </small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div
                        className="text-center"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          window.open(
                            "/geotagging-benefits?tab=analytics",
                            "_blank"
                          )
                        }
                      >
                        <div className="text-warning fs-4">📊</div>
                        <small>
                          <strong>Analytics</strong>
                          <br />
                          Spatial analysis
                          <br />
                          <Badge bg="info" className="mt-1">
                            Learn More
                          </Badge>
                        </small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div
                        className="text-center"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          window.open(
                            "/geotagging-benefits?tab=integration",
                            "_blank"
                          )
                        }
                      >
                        <div className="text-info fs-4">🔗</div>
                        <small>
                          <strong>Integration</strong>
                          <br />
                          External services
                          <br />
                          <Badge bg="info" className="mt-1">
                            Learn More
                          </Badge>
                        </small>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  const renderHistoryContent = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading tree history...</p>
        </div>
      );
    }

    if (careLogs.length === 0) {
      return (
        <Alert variant="info" className="m-4">
          <Alert.Heading className="h6">
            <i className="ti-camera me-2"></i>
            No Photo History Available
          </Alert.Heading>
          <p className="mb-0">
            This tree doesn't have any care logs with photos yet. Start
            documenting your tree's growth by adding care logs with photos!
          </p>
        </Alert>
      );
    }

    if (viewMode === "timeline") {
      return (
        <div className="p-4">
          <div className="timeline">
            {careLogs.map((log, index) => (
              <div key={log.id} className="timeline-item mb-4">
                <div className="timeline-marker">
                  <div className="timeline-icon bg-primary text-white">
                    {getActivityIcon(log.activity_type)}
                  </div>
                </div>
                <Card className="timeline-content border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1 text-capitalize">
                          {log.activity_type || "General Care"}
                        </h6>
                        <small className="text-muted">
                          {formatDate(log.created_at)} •{" "}
                          {getTimeAgo(log.created_at)}
                        </small>
                      </div>
                    </div>

                    {log.description && (
                      <p className="mb-3 text-muted">{log.description}</p>
                    )}

                    {log.images && log.images.length > 0 && (
                      <Row className="g-2">
                        {log.images.map((image, imgIndex) => (
                          <Col xs={6} md={4} key={imgIndex}>
                            <div
                              className="position-relative cursor-pointer"
                              onClick={() => {
                                setSelectedImage(image);
                                setShowImageModal(true);
                              }}
                            >
                              <Image
                                src={image}
                                alt={`${log.activity_type} - ${imgIndex + 1}`}
                                className="w-100 rounded"
                                style={{
                                  height: "120px",
                                  objectFit: "cover",
                                  transition: "transform 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = "scale(1)";
                                }}
                              />
                              <div className="position-absolute top-0 end-0 m-1">
                                <Badge bg="dark" className="opacity-75">
                                  <i className="ti-zoom-in"></i>
                                </Badge>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    )}

                    {log.notes && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted">
                          <strong>Notes:</strong> {log.notes}
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Table view
    return (
      <div className="p-4">
        <Table responsive hover>
          <thead>
            <tr>
              <th>Date</th>
              <th>Activity</th>
              <th>Description</th>
              <th>Photos</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {careLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <div>
                    {formatDate(log.created_at)}
                    <br />
                    <small className="text-muted">
                      {getTimeAgo(log.created_at)}
                    </small>
                  </div>
                </td>
                <td>
                  <Badge variant="outline-primary" className="text-capitalize">
                    {getActivityIcon(log.activity_type)} {log.activity_type}
                  </Badge>
                </td>
                <td>{log.description || "-"}</td>
                <td>
                  {log.images && log.images.length > 0 ? (
                    <div className="d-flex gap-1">
                      {log.images.slice(0, 3).map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`Care log ${index + 1}`}
                          width={40}
                          height={40}
                          className="rounded cursor-pointer"
                          style={{ objectFit: "cover" }}
                          onClick={() => {
                            setSelectedImage(image);
                            setShowImageModal(true);
                          }}
                        />
                      ))}
                      {log.images.length > 3 && (
                        <div
                          className="d-flex align-items-center justify-content-center bg-light rounded"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <small>+{log.images.length - 3}</small>
                        </div>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {log.notes ? (
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>{log.notes}</Tooltip>}
                    >
                      <span
                        className="text-truncate d-inline-block"
                        style={{ maxWidth: "150px" }}
                      >
                        {log.notes}
                      </span>
                    </OverlayTrigger>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  if (!selectedTree) return null;

  return (
    <>
      <style jsx global>{`
        .timeline {
          position: relative;
          padding-left: 30px;
        }

        .timeline::before {
          content: "";
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #007bff, #6c757d);
        }

        .timeline-item {
          position: relative;
        }

        .timeline-marker {
          position: absolute;
          left: -22px;
          top: 0;
          z-index: 2;
        }

        .timeline-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .timeline-content {
          margin-left: 15px;
        }

        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>

      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="d-flex align-items-center">
            <i className="ti-tree me-3"></i>
            <div>
              <h5 className="mb-0">
                {selectedTree.trees?.name || selectedTree.name} History
              </h5>
              <small className="opacity-75">
                {selectedTree.trees?.code || selectedTree.code} • Block{" "}
                {(selectedPosition?.block_index || 0) + 1}, Position (
                {selectedPosition?.grid_x}, {selectedPosition?.grid_y})
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-0">
          <Nav variant="tabs" className="px-3 pt-3">
            <Nav.Item>
              <Nav.Link
                active={activeTab === "history"}
                onClick={() => setActiveTab("history")}
                className="d-flex align-items-center"
              >
                <i className="ti-camera me-2"></i>
                Growth History
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === "location"}
                onClick={() => setActiveTab("location")}
                className="d-flex align-items-center"
              >
                <i className="ti-location-pin me-2"></i>
                Location Data
                {locationData?.latitude && locationData?.longitude && (
                  <Badge bg="success" className="ms-2">
                    GPS
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {activeTab === "history" && (
            <>
              {careLogs.length > 0 && (
                <div className="px-3 py-2 bg-light border-bottom">
                  <ButtonGroup size="sm">
                    <Button
                      variant={
                        viewMode === "timeline" ? "primary" : "outline-primary"
                      }
                      onClick={() => setViewMode("timeline")}
                    >
                      <i className="ti-layout-list-thumb me-1"></i>
                      Timeline
                    </Button>
                    <Button
                      variant={
                        viewMode === "table" ? "primary" : "outline-primary"
                      }
                      onClick={() => setViewMode("table")}
                    >
                      <i className="ti-layout-grid2 me-1"></i>
                      Table
                    </Button>
                  </ButtonGroup>
                </div>
              )}
              {renderHistoryContent()}
            </>
          )}

          {activeTab === "location" && renderLocationInfo()}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Full-size image modal */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Tree Photo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          {selectedImage && (
            <Image
              src={selectedImage}
              alt="Tree care photo"
              className="w-100"
              style={{ maxHeight: "70vh", objectFit: "contain" }}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EnhancedTreeHistoryModal;
