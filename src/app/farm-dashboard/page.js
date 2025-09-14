"use client";

import React, { useState, useEffect } from "react";
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
  const [varietyFilter, setVarietyFilter] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set()); // For filtering by specific variety

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
    // Calculate stats based on tree positions, including all planted trees
    let totalTrees = 0;
    let healthyTrees = 0;
    let fruitingTrees = 0;
    let diseasedTrees = 0;

    trees.forEach((tree) => {
      if (tree.tree_positions && tree.tree_positions.length > 0) {
        tree.tree_positions.forEach((position) => {
          const status = position.status;
          totalTrees++;

          if (status === "healthy") {
            healthyTrees++;
          } else if (status === "fruiting") {
            fruitingTrees++;
          } else if (status === "diseased") {
            diseasedTrees++;
          }
        });
      }
    });

    return { totalTrees, healthyTrees, fruitingTrees, diseasedTrees };
  };

  // Group trees by type and variety
  const getTreeVarietyGroups = () => {
    const groups = {};

    trees.forEach((tree) => {
      // Use tree positions to get planted varieties, including all planted trees
      if (tree.tree_positions && tree.tree_positions.length > 0) {
        tree.tree_positions.forEach((position) => {
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
          case "healthy":
            matchingPositions = tree.tree_positions.filter(
              (pos) => pos.status === "healthy"
            );
            break;
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
          case "variety":
            // When filtering by variety/tree type, show all statuses
            matchingPositions = tree.tree_positions;
            break;
          case "all":
          default:
            // For "all" view, exclude healthy trees - only show trees needing attention
            matchingPositions = tree.tree_positions.filter(
              (pos) => pos.status === "fruiting" || pos.status === "diseased"
            );
        }

        // If variety filter is active, further filter positions by variety
        if (varietyFilter) {
          matchingPositions = matchingPositions.filter((pos) => {
            // If variety is null, show all varieties for this tree type
            if (varietyFilter.variety === null) {
              return tree.name === varietyFilter.treeName;
            }
            // Otherwise, filter by specific variety
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

  const toggleRowExpansion = (index) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const getDetailedTreesForGroup = (group) => {
    // Get all trees with positions for this group
    const detailedTrees = [];

    trees.forEach((tree) => {
      if (
        tree.name === group.name &&
        tree.tree_positions &&
        tree.tree_positions.length > 0
      ) {
        tree.tree_positions.forEach((position) => {
          detailedTrees.push({
            ...tree,
            position: position,
            variety: position.variety || "Standard",
            plantingDate: position.planting_date || tree.planting_date,
            status: position.status || "healthy",
            location: `Block ${position.block_index + 1}, Grid (${
              position.grid_x
            }, ${position.grid_y})`,
          });
        });
      }
    });

    return detailedTrees.sort((a, b) => a.variety.localeCompare(b.variety));
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
    const hasAnyTrees = trees.some(
      (tree) => tree.tree_positions && tree.tree_positions.length > 0
    );

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
                Filtered by: {varietyFilter?.treeName}
                {varietyFilter?.variety
                  ? ` - ${varietyFilter.variety}`
                  : " (All Varieties)"}
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
                  {!hasAnyTrees ? (
                    <>
                      <i className="ti-tree text-success fs-1 d-block mb-3"></i>
                      <h5>No trees planted yet</h5>
                      <p>Start by planting your first tree in the farm.</p>
                      <Button variant="success" href="/trees">
                        <i className="ti-plus me-2"></i>
                        Add Your First Tree
                      </Button>
                    </>
                  ) : (
                    <>
                      <i className="ti-heart text-success fs-1 d-block mb-3"></i>
                      <h5>All trees are healthy!</h5>
                      <p>
                        Your trees are doing well. Trees needing attention will
                        show here.
                      </p>
                    </>
                  )}
                </>
              )}

              {activeView === "healthy" && (
                <>
                  <i className="ti-heart text-success fs-1 d-block mb-3"></i>
                  <h5>No healthy trees</h5>
                  <p>Healthy trees will show here.</p>
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
      <style jsx>{`
        .table tbody tr:hover {
          background-color: transparent !important;
        }
        .collapse-toggle {
          background-color: transparent !important;
          border: 1px solid #dee2e6 !important;
          color: #6c757d !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .collapse-toggle:hover {
          background-color: #f8f9fa !important;
          border-color: #adb5bd !important;
          color: #495057 !important;
        }
        .collapse-toggle:focus {
          box-shadow: none !important;
        }
        .table th {
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .table tbody tr:last-child td {
          border-bottom: none;
        }
      `}</style>
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
          <Col md={3}>
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
                <p className="text-muted mb-0 small">Total Trees</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card
              className={`border shadow-sm rounded-3 h-100 ${
                activeView === "healthy" && !varietyFilter
                  ? "border-success"
                  : ""
              }`}
              style={{
                borderColor:
                  activeView === "healthy" && !varietyFilter
                    ? "#198754"
                    : "#e3e6f0",
                transition: "all 0.2s ease",
                cursor: "pointer",
                borderWidth:
                  activeView === "healthy" && !varietyFilter ? "2px" : "1px",
              }}
              onClick={() => {
                setActiveView("healthy");
                setVarietyFilter(null);
              }}
            >
              <Card.Body className="text-center p-4">
                <div
                  className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                  style={{ width: "60px", height: "60px" }}
                >
                  <i className="ti-heart text-success fs-4"></i>
                </div>
                <h5 className="mb-2">{stats.healthyTrees}</h5>
                <p className="text-muted mb-0 small">Healthy Trees</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
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

          <Col md={3}>
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
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 ps-4">Tree Type</th>
                      <th className="border-0 text-center">Code</th>
                      <th className="border-0 text-center">Total Count</th>
                      <th className="border-0 text-center">Varieties</th>
                      <th className="border-0 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTreeVarietyGroups().map((group, index) => (
                      <React.Fragment key={index}>
                        {/* Main Tree Type Row */}
                        <tr className="tree-type-row">
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <button
                                className="btn btn-sm p-1 collapse-toggle"
                                type="button"
                                style={{ width: "24px", height: "24px" }}
                                onClick={() => toggleRowExpansion(index)}
                              >
                                <i
                                  className={
                                    expandedRows.has(index)
                                      ? "ti-minus"
                                      : "ti-plus"
                                  }
                                  style={{ fontSize: "12px" }}
                                ></i>
                              </button>
                              <h6 className="mb-0 text-success fw-bold">
                                {group.name}
                              </h6>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <Badge bg="success" className="fs-6">
                              {group.code}
                            </Badge>
                          </td>
                          <td className="text-center py-3">
                            <Badge bg="primary" pill className="fs-6">
                              {group.totalCount}
                            </Badge>
                          </td>
                          <td className="text-center py-3">
                            <span className="text-muted">
                              {Object.keys(group.varieties).length} varieties
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => {
                                setVarietyFilter({
                                  treeName: group.name,
                                  variety: null,
                                });
                                setActiveView("variety");
                              }}
                            >
                              <i className="ti-filter me-1"></i>
                              View All
                            </Button>
                          </td>
                        </tr>

                        {/* Collapsible Detailed Trees Row */}
                        {expandedRows.has(index) && (
                          <tr>
                            <td colSpan="5" className="p-0 border-0">
                              <div className="bg-light bg-opacity-50 p-3 border-top">
                                <div className="row g-2">
                                  {getDetailedTreesForGroup(group).map(
                                    (tree, treeIndex) => (
                                      <div
                                        key={`${tree.id}-${tree.position.id}`}
                                        className="col-md-6 col-lg-4"
                                      >
                                        <div className="card border-0 shadow-sm h-100">
                                          <div className="card-body p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                              <div>
                                                <h6 className="mb-1 text-success fw-bold">
                                                  {tree.variety}
                                                </h6>
                                                <small className="text-muted">
                                                  {tree.location}
                                                </small>
                                              </div>
                                              <Badge
                                                bg={
                                                  tree.status === "healthy"
                                                    ? "success"
                                                    : tree.status === "fruiting"
                                                    ? "warning"
                                                    : "danger"
                                                }
                                              >
                                                {tree.status}
                                              </Badge>
                                            </div>

                                            <div className="mb-2">
                                              <small className="text-muted d-block">
                                                <i className="ti-calendar me-1"></i>
                                                Planted:{" "}
                                                {tree.plantingDate
                                                  ? new Date(
                                                      tree.plantingDate
                                                    ).toLocaleDateString()
                                                  : "Not specified"}
                                              </small>
                                            </div>

                                            {tree.description && (
                                              <div className="mb-2">
                                                <small className="text-muted">
                                                  {tree.description.length > 60
                                                    ? tree.description.substring(
                                                        0,
                                                        60
                                                      ) + "..."
                                                    : tree.description}
                                                </small>
                                              </div>
                                            )}

                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                              <small className="text-muted">
                                                <i className="ti-target me-1"></i>
                                                {tree.category}
                                              </small>
                                              <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedTree(tree);
                                                  setShowTreeModal(true);
                                                }}
                                              >
                                                <i className="ti-eye me-1"></i>
                                                View
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Content based on selected tile */}
        <Row>
          <Col lg={12}>{renderContent()}</Col>
        </Row>

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
