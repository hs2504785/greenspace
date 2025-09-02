"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import AdminGuard from "@/components/common/AdminGuard";
import EnhancedTreeDetailsModal from "@/components/modals/EnhancedTreeDetailsModal";

export default function FarmDashboardPage() {
  const [activeView, setActiveView] = useState("all");
  const [trees, setTrees] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null);
  const [varietyFilter, setVarietyFilter] = useState(null); // For filtering by specific variety

  // Get user ID from authentication - works for any admin/superadmin
  const [farmId, setFarmId] = useState(null);

  useEffect(() => {
    // Get authenticated user ID - works for any admin/superadmin
    const getUserId = async () => {
      try {
        // Use robust current-user API that works for any admin/superadmin
        const response = await fetch("/api/auth/current-user");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.id) {
            console.log(
              `Using ${data.user.source} user:`,
              data.user.email,
              `(${data.user.role})`
            );
            setFarmId(data.user.id);
            return;
          }
        }

        // If API fails, show error
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "Failed to get current user:",
          errorData.error || "Unknown error"
        );
        toast.error(
          "Unable to load user data. Please ensure you have admin access."
        );
      } catch (error) {
        console.error("Error getting user ID:", error);
        toast.error("Failed to load user data. Please check your connection.");
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    if (farmId) {
      fetchData();
    }
  }, [farmId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTrees(), fetchLayouts()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load farm data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrees = async () => {
    try {
      const response = await fetch(`/api/trees?farmId=${farmId}`);
      if (response.ok) {
        const data = await response.json();
        setTrees(data);
      }
    } catch (error) {
      console.error("Error fetching trees:", error);
    }
  };

  const fetchLayouts = async () => {
    try {
      const response = await fetch(`/api/farm-layouts?farmId=${farmId}`);
      if (response.ok) {
        const data = await response.json();
        setLayouts(data);
        const activeLayout = data.find((l) => l.is_active) || data[0];
        setSelectedLayout(activeLayout);
      }
    } catch (error) {
      console.error("Error fetching layouts:", error);
    }
  };

  const getTreeStats = () => {
    // Calculate stats based on tree positions, excluding healthy trees
    let totalTrees = 0;
    let fruitingTrees = 0;
    let diseasedTrees = 0;

    trees.forEach((tree) => {
      if (tree.tree_positions && tree.tree_positions.length > 0) {
        tree.tree_positions.forEach((position) => {
          const status = position.status;
          // Only count non-healthy trees
          if (status === "fruiting") {
            fruitingTrees++;
            totalTrees++;
          } else if (status === "diseased") {
            diseasedTrees++;
            totalTrees++;
          }
          // Skip healthy trees entirely
        });
      }
    });

    return { totalTrees, fruitingTrees, diseasedTrees };
  };

  // Group trees by type and variety
  const getTreeVarietyGroups = () => {
    const groups = {};

    trees.forEach((tree) => {
      // Use tree positions to get planted varieties, excluding healthy trees
      if (tree.tree_positions && tree.tree_positions.length > 0) {
        tree.tree_positions.forEach((position) => {
          // Skip healthy trees
          if (position.status === "healthy") return;

          const treeName = tree.name;
          const variety = position.variety || "Standard";

          if (!groups[treeName]) {
            groups[treeName] = {
              name: treeName,
              code: tree.code,
              varieties: {},
              totalCount: 0,
            };
          }

          if (!groups[treeName].varieties[variety]) {
            groups[treeName].varieties[variety] = 0;
          }

          groups[treeName].varieties[variety]++;
          groups[treeName].totalCount++;
        });
      } else {
        // Handle trees without positions (template trees)
        const treeName = tree.name;
        const variety = "Available";

        if (!groups[treeName]) {
          groups[treeName] = {
            name: treeName,
            code: tree.code,
            varieties: {},
            totalCount: 0,
          };
        }

        if (!groups[treeName].varieties[variety]) {
          groups[treeName].varieties[variety] = 0;
        }

        groups[treeName].varieties[variety]++;
        groups[treeName].totalCount++;
      }
    });

    return Object.values(groups).sort((a, b) => b.totalCount - a.totalCount);
  };

  const filterTrees = (status) => {
    let filteredTrees = [];

    // Create filtered trees based on status from tree_positions
    trees.forEach((tree) => {
      if (tree.tree_positions && tree.tree_positions.length > 0) {
        // Filter tree positions by status
        let matchingPositions = tree.tree_positions;

        switch (status) {
          case "fruiting":
            matchingPositions = tree.tree_positions.filter(
              (pos) => pos.status === "fruiting"
            );
            break;
          case "diseased":
            matchingPositions = tree.tree_positions.filter(
              (pos) => pos.status === "diseased"
            );
            break;
          case "all":
          default:
            // For "all" view, exclude healthy trees - only show fruiting and diseased
            matchingPositions = tree.tree_positions.filter(
              (pos) => pos.status === "fruiting" || pos.status === "diseased"
            );
        }

        // If variety filter is active, further filter positions by variety
        if (varietyFilter) {
          matchingPositions = matchingPositions.filter((pos) => {
            return (
              tree.name === varietyFilter.treeName &&
              (pos.variety || "Standard") === varietyFilter.variety
            );
          });
        }

        // Create tree instances for each matching position
        matchingPositions.forEach((position) => {
          filteredTrees.push({
            ...tree,
            // Add position data to tree for display
            currentPosition: position,
            // Override tree properties with position-specific data
            status: position.status,
            variety: position.variety,
            planting_date: position.planting_date,
            // Create unique ID for each tree-position combination
            id: `${tree.id}-${position.id}`,
            originalTreeId: tree.id,
            positionId: position.id,
          });
        });
      }
      // Note: Template trees (without positions) are no longer shown in tree lists
      // They should only be available in planting/adding new tree contexts
    });

    return filteredTrees;
  };

  // Function to handle variety filter clicks
  const handleVarietyFilter = (treeName, variety) => {
    if (
      varietyFilter &&
      varietyFilter.treeName === treeName &&
      varietyFilter.variety === variety
    ) {
      // Clear filter if clicking the same variety
      setVarietyFilter(null);
      setActiveView("all");
    } else {
      // Set new variety filter
      setVarietyFilter({ treeName, variety });
      setActiveView("variety");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      healthy: { bg: "success", text: "🌱 Healthy", icon: "ti-heart" },
      fruiting: { bg: "warning", text: "🍎 Fruiting", icon: "ti-shine" },
      diseased: { bg: "danger", text: "🚨 Diseased", icon: "ti-alert" },
    };

    const badgeInfo = statusMap[status] || {
      bg: "secondary",
      text: status,
      icon: "ti-help",
    };
    return <Badge bg={badgeInfo.bg}>{badgeInfo.text}</Badge>;
  };

  const stats = getTreeStats();

  const renderContent = () => {
    const filteredData = filterTrees(activeView);

    return (
      <Card className="border-0 shadow-sm">
        <Card.Header
          className={
            varietyFilter ? "bg-primary bg-opacity-10 border-0" : "d-none"
          }
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1 text-primary">
                <i className="ti-filter me-2"></i>
                Filtered by: {varietyFilter?.treeName} -{" "}
                {varietyFilter?.variety}
              </h6>
              <small className="text-muted">
                Showing {filteredData.length} tree
                {filteredData.length !== 1 ? "s" : ""}
              </small>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setVarietyFilter(null);
                setActiveView("all");
              }}
            >
              <i className="ti-close me-1"></i>
              Clear Filter
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {filteredData.length === 0 ? (
            <div className="text-center text-muted py-5">
              {activeView === "variety" && varietyFilter && (
                <>
                  <i className="ti-filter text-primary fs-1 d-block mb-3"></i>
                  <h5>No trees found for this variety</h5>
                  <p>
                    No {varietyFilter.treeName} trees with variety "
                    {varietyFilter.variety}" found.
                  </p>
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setVarietyFilter(null);
                      setActiveView("all");
                    }}
                  >
                    Clear Filter
                  </Button>
                </>
              )}
              {activeView === "all" && !varietyFilter && (
                <>
                  <i className="ti-tree text-success fs-1 d-block mb-3"></i>
                  <h5>No trees planted yet</h5>
                  <p>Start by planting your first tree in the farm.</p>
                  <Button variant="success" href="/trees">
                    <i className="ti-plus me-2"></i>
                    Add Your First Tree
                  </Button>
                </>
              )}

              {activeView === "fruiting" && (
                <>
                  <i className="ti-shine text-warning fs-1 d-block mb-3"></i>
                  <h5>No fruiting trees</h5>
                  <p>Trees that are bearing fruit will show here.</p>
                </>
              )}
              {activeView === "diseased" && (
                <>
                  <i className="ti-alert text-danger fs-1 d-block mb-3"></i>
                  <h5>No diseased trees</h5>
                  <p>Trees requiring attention will appear here.</p>
                </>
              )}
            </div>
          ) : (
            <Row>
              {filteredData.map((tree) => (
                <Col md={4} key={tree.id} className="mb-3">
                  <Card
                    className="h-100 border shadow-sm rounded-3"
                    style={{
                      borderColor: "#e3e6f0",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedTree(tree);
                      setShowTreeModal(true);
                    }}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg="secondary" className="fs-6">
                          {tree.code}
                        </Badge>
                        {getStatusBadge(tree.status)}
                      </div>
                      <h6 className="card-title">{tree.name}</h6>
                      <p className="card-text text-muted small">
                        {tree.scientific_name}
                        {tree.variety && (
                          <>
                            <br />
                            Variety: {tree.variety}
                          </>
                        )}
                      </p>
                      {tree.planting_date && (
                        <small className="text-muted">
                          Planted:{" "}
                          {new Date(tree.planting_date).toLocaleDateString()}
                        </small>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" className="mb-3" />
        <p className="text-muted">Loading your farm dashboard...</p>
      </Container>
    );
  }

  return (
    <AdminGuard requiredRole="admin">
      <Container fluid className="pb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">🌱 Farm Dashboard</h1>
            <p className="text-muted mb-0">Manage your trees and farm layout</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="success"
              href="/farm-layout-fullscreen"
              className="text-decoration-none"
            >
              <i className="ti-fullscreen me-2"></i>
              Full Screen Layout
            </Button>
            <Button variant="outline-secondary" href="/trees">
              <i className="ti-settings me-2"></i>
              Manage Trees
            </Button>
            <Button variant="outline-primary" onClick={fetchData}>
              <i className="ti-reload me-2"></i>
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Tiles - Clickable */}
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card
              className={`border shadow-sm rounded-3 h-100 ${
                activeView === "all" && !varietyFilter ? "border-primary" : ""
              }`}
              style={{
                borderColor:
                  activeView === "all" && !varietyFilter
                    ? "#0d6efd"
                    : "#e3e6f0",
                transition: "all 0.2s ease",
                cursor: "pointer",
                borderWidth:
                  activeView === "all" && !varietyFilter ? "2px" : "1px",
              }}
              onClick={() => {
                setActiveView("all");
                setVarietyFilter(null);
              }}
            >
              <Card.Body className="text-center p-4">
                <div
                  className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                  style={{ width: "60px", height: "60px" }}
                >
                  <i className="ti-shine text-primary fs-4"></i>
                </div>
                <h5 className="mb-2">{stats.totalTrees}</h5>
                <p className="text-muted mb-0 small">Active Trees</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card
              className={`border shadow-sm rounded-3 h-100 ${
                activeView === "fruiting" && !varietyFilter
                  ? "border-warning"
                  : ""
              }`}
              style={{
                borderColor:
                  activeView === "fruiting" && !varietyFilter
                    ? "#ffc107"
                    : "#e3e6f0",
                transition: "all 0.2s ease",
                cursor: "pointer",
                borderWidth:
                  activeView === "fruiting" && !varietyFilter ? "2px" : "1px",
              }}
              onClick={() => {
                setActiveView("fruiting");
                setVarietyFilter(null);
              }}
            >
              <Card.Body className="text-center p-4">
                <div
                  className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                  style={{ width: "60px", height: "60px" }}
                >
                  <i className="ti-shine text-warning fs-4"></i>
                </div>
                <h5 className="mb-2">{stats.fruitingTrees}</h5>
                <p className="text-muted mb-0 small">Fruiting Trees</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card
              className={`border shadow-sm rounded-3 h-100 ${
                activeView === "diseased" && !varietyFilter
                  ? "border-danger"
                  : ""
              }`}
              style={{
                borderColor:
                  activeView === "diseased" && !varietyFilter
                    ? "#dc3545"
                    : "#e3e6f0",
                transition: "all 0.2s ease",
                cursor: "pointer",
                borderWidth:
                  activeView === "diseased" && !varietyFilter ? "2px" : "1px",
              }}
              onClick={() => {
                setActiveView("diseased");
                setVarietyFilter(null);
              }}
            >
              <Card.Body className="text-center p-4">
                <div
                  className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                  style={{ width: "60px", height: "60px" }}
                >
                  <i className="ti-alert text-danger fs-4"></i>
                </div>
                <h5 className="mb-2">{stats.diseasedTrees}</h5>
                <p className="text-muted mb-0 small">Diseased Trees</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tree Variety Groups Section - Only show when viewing all trees */}
        {trees.length > 0 && activeView === "all" && !varietyFilter && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-light border-0">
              <h5 className="mb-0">
                <i className="ti-stats-up text-success me-2"></i>
                Tree Varieties Overview
              </h5>
              <small className="text-muted">
                Detailed breakdown of planted trees by type and variety
              </small>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {getTreeVarietyGroups().map((group, index) => (
                  <Col md={4} lg={3} key={index}>
                    <Card className="h-100 border border-success border-opacity-25 bg-light bg-opacity-50">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg="success" className="fs-6">
                              {group.code}
                            </Badge>
                            <h6 className="mb-0 text-success fw-bold">
                              {group.name}
                            </h6>
                          </div>
                          <Badge bg="primary" pill>
                            {group.totalCount}
                          </Badge>
                        </div>

                        <div className="varieties-list">
                          {Object.entries(group.varieties).map(
                            ([variety, count]) => (
                              <div
                                key={variety}
                                className={`d-flex justify-content-between align-items-center py-1 border-bottom border-light variety-item ${
                                  varietyFilter &&
                                  varietyFilter.treeName === group.name &&
                                  varietyFilter.variety === variety
                                    ? "bg-primary bg-opacity-10 border-primary"
                                    : ""
                                }`}
                                style={{
                                  cursor: "pointer",
                                  borderRadius: "4px",
                                  transition: "all 0.2s ease",
                                }}
                                onClick={() =>
                                  handleVarietyFilter(group.name, variety)
                                }
                                onMouseEnter={(e) => {
                                  if (
                                    !varietyFilter ||
                                    varietyFilter.treeName !== group.name ||
                                    varietyFilter.variety !== variety
                                  ) {
                                    e.target.style.backgroundColor =
                                      "rgba(0,123,255,0.05)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (
                                    !varietyFilter ||
                                    varietyFilter.treeName !== group.name ||
                                    varietyFilter.variety !== variety
                                  ) {
                                    e.target.style.backgroundColor =
                                      "transparent";
                                  }
                                }}
                              >
                                <span className="small text-muted">
                                  {variety}
                                </span>
                                <Badge
                                  bg={
                                    varietyFilter &&
                                    varietyFilter.treeName === group.name &&
                                    varietyFilter.variety === variety
                                      ? "primary"
                                      : "secondary"
                                  }
                                  pill
                                  className="small"
                                >
                                  {count}
                                </Badge>
                              </div>
                            )
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Content based on selected tile */}
        {renderContent()}

        {/* Enhanced Tree Details Modal */}
        <EnhancedTreeDetailsModal
          key={selectedTree?.id || "no-tree"}
          show={showTreeModal}
          onHide={() => setShowTreeModal(false)}
          selectedTree={selectedTree}
          selectedPosition={null}
          onTreeUpdated={async () => {
            // Close the tree details modal
            setShowTreeModal(false);
            // Clear selected tree to prevent showing stale data
            setSelectedTree(null);
            // Refresh data
            await fetchData();
          }}
          onTreeDeleted={async () => {
            // Close the tree details modal
            setShowTreeModal(false);
            // Clear selected tree to prevent showing stale data
            setSelectedTree(null);
            // Refresh data
            await fetchData();
          }}
          farmId={farmId}
          layoutId={selectedLayout?.id}
        />
      </Container>
    </AdminGuard>
  );
}
