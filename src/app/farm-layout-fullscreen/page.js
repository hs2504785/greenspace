"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
  Navbar,
  Nav,
  Dropdown,
  ButtonGroup,
  Offcanvas,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import PureCSSGridFarm from "@/components/farm/PureCSSGridFarm";
import PlantTreeModal from "@/components/farm/PlantTreeModal";
import { getTreeType } from "@/utils/treeTypeClassifier";
import AdminGuard from "@/components/common/AdminGuard";
import EnhancedTreeDetailsModal from "@/components/modals/EnhancedTreeDetailsModal";

// Note: Tree types are now loaded from database dynamically

export default function FarmLayoutFullscreenPage() {
  const router = useRouter();
  const [trees, setTrees] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [initialPlantFormData, setInitialPlantFormData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use your existing user ID - in real app, get from authentication
  const farmId = "0e13a58b-a5e2-4ed3-9c69-9634c7413550";

  useEffect(() => {
    // Set document title for client component
    document.title = "Farm Layout - Full View | Arya Natural Farms";
    fetchData();
  }, []);

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

  const fetchTrees = useCallback(async () => {
    try {
      const response = await fetch(`/api/trees?farmId=${farmId}`);
      if (response.ok) {
        const data = await response.json();
        setTrees(data);
      }
    } catch (error) {
      console.error("Error fetching trees:", error);
    }
  }, [farmId]);

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

  const handleTreeClick = useCallback((tree, position) => {
    setSelectedPosition(position);
    if (tree) {
      setSelectedTree(tree);
      setShowTreeModal(true);
    } else {
      // Empty position clicked - show plant modal with empty fields
      setSelectedTree(null);
      generateUniquTreeCode(); // This will generate suggestions but not auto-fill
      setShowPlantModal(true);
    }
  }, []); // No dependencies - functions are stable

  const generateUniquTreeCode = useCallback(() => {
    // Use tree codes from database
    const treeCodes = trees.map((t) => t.code);

    // Try to be more systematic - use position-based suggestions first
    let preferredCodes = [];

    // Suggest based on visual classification system
    if (selectedPosition) {
      const { x, y, blockIndex } = selectedPosition;

      // Use the same classification system as the visual circles
      const treeType = getTreeType(x, y, 24, 24);

      switch (treeType) {
        case "big":
        case "centerBig":
          // Big trees for corners and center
          preferredCodes = ["M", "JA", "CA", "A", "AV", "CO"];
          break;
        case "medium":
          // Medium trees for mid-edge positions
          preferredCodes = ["G", "L", "P", "C", "MR", "NE"];
          break;
        case "small":
          // Small trees for quarter positions
          preferredCodes = ["AN", "SF", "BC", "LC", "MF", "AM", "OR"];
          break;
        case "tiny":
        default:
          // Tiny trees for all other positions
          preferredCodes = ["AM", "OR", "BB", "LC", "MF", "BC", "SF"];
          break;
      }
    }

    // Combine preferred codes with all codes as fallback
    const codesToTry = [
      ...preferredCodes,
      ...treeCodes.filter((c) => !preferredCodes.includes(c)),
    ];

    let uniqueCode = "";

    // Find the first available code with lowest number
    for (const baseCode of codesToTry) {
      const existingCodes = trees
        .map((t) => t.code)
        .filter((code) => code.startsWith(baseCode))
        .map((code) => {
          const num = code.replace(baseCode, "");
          return num === "" ? 1 : parseInt(num) || 1;
        })
        .sort((a, b) => a - b);

      let nextNumber = 1;
      for (const num of existingCodes) {
        if (num === nextNumber) {
          nextNumber++;
        } else {
          break;
        }
      }

      uniqueCode = nextNumber === 1 ? baseCode : `${baseCode}${nextNumber}`;

      // Check if this code truly doesn't exist (double-check)
      const codeExists = trees.some((t) => t.code === uniqueCode);
      if (!codeExists) {
        break; // Found a unique code
      }
    }

    // Generate a descriptive name based on the code
    const getTreeNameFromCode = (code) => {
      const baseName = code.replace(/\d+$/, ""); // Remove numbers
      const dbTree = trees.find((t) => t.code === baseName);
      return dbTree ? dbTree.name : `${code} Tree`;
    };

    setInitialPlantFormData({
      tree_id: "",
      new_tree: {
        code: "",
        name: "",
        scientific_name: "",
        variety: "",
        status: "healthy",
      },
      // Store suggestions for optional use
      suggestions: {
        code: uniqueCode,
        name: getTreeNameFromCode(uniqueCode),
      },
    });
  }, [trees, selectedPosition]); // Added selectedPosition dependency for position-based suggestions

  // Callback for when tree is successfully planted
  const handleTreePlanted = useCallback(
    async (newTree) => {
      // Immediately update the trees state for instant UI feedback
      if (newTree) {
        setTrees((prevTrees) => [...prevTrees, newTree]);
      }

      // Trigger refresh of PureCSSGridFarm component
      setRefreshKey((prev) => prev + 1);

      // Also fetch from server to ensure consistency
      await fetchTrees();
    },
    [fetchTrees]
  );

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast.error("Fullscreen not supported on this device");
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const getTreeStats = () => {
    const totalTrees = trees.length;
    const healthyTrees = trees.filter((t) => t.status === "healthy").length;
    const fruitingTrees = trees.filter((t) => t.status === "fruiting").length;
    const diseasedTrees = trees.filter((t) => t.status === "diseased").length;
    return { totalTrees, healthyTrees, fruitingTrees, diseasedTrees };
  };

  const stats = getTreeStats();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div
            className="spinner-border text-success"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your farm layout...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard requiredRole="admin">
      <div className="farm-layout-fullscreen mt-n4">
        {/* Compact Top Navigation Bar */}
        <Navbar
          bg="white"
          expand="lg"
          className="border-bottom shadow-sm sticky-top py-2"
          style={{ zIndex: 1040 }}
        >
          <Container fluid className="px-2 px-lg-3">
            {/* Left side - Minimal branding */}
            <Navbar.Brand className="fw-bold text-success me-3 d-flex align-items-center">
              <i className="ti-layout-grid3 me-1"></i>
              <span className="d-none d-sm-inline">Farm Layout</span>
            </Navbar.Brand>

            {/* Mobile Toggle */}
            <Navbar.Toggle
              aria-controls="farm-navbar-nav"
              className="border-0 ms-auto d-lg-none"
            />

            {/* Center - Quick Stats (Desktop only) */}
            <div className="d-none d-lg-flex gap-2 me-auto">
              <Badge bg="primary" className="py-1 px-2">
                <i className="ti-stats-up me-1"></i>
                {stats.totalTrees}
              </Badge>
              <Badge bg="success" className="py-1 px-2">
                <i className="ti-check me-1"></i>
                {stats.healthyTrees}
              </Badge>
              {stats.fruitingTrees > 0 && (
                <Badge bg="warning" className="py-1 px-2">
                  <i className="ti-gift me-1"></i>
                  {stats.fruitingTrees}
                </Badge>
              )}
              {stats.diseasedTrees > 0 && (
                <Badge bg="danger" className="py-1 px-2">
                  <i className="ti-alert me-1"></i>
                  {stats.diseasedTrees}
                </Badge>
              )}
            </div>

            {/* Right side - Action buttons */}
            <Navbar.Collapse
              id="farm-navbar-nav"
              className="justify-content-end"
            >
              <Nav className="align-items-center">
                {/* Zoom Controls - Desktop */}
                <div className="d-none d-md-flex me-2">
                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-secondary"
                      onClick={() =>
                        setZoom((prev) => Math.max(0.5, prev - 0.1))
                      }
                      title="Zoom Out"
                    >
                      <i className="ti-zoom-out"></i>
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setZoom(1)}
                      title={`Reset (${(zoom * 100).toFixed(0)}%)`}
                    >
                      <i className="ti-target"></i>
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
                      title="Zoom In"
                    >
                      <i className="ti-zoom-in"></i>
                    </Button>
                  </ButtonGroup>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-1">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowSidebar(true)}
                    title="Info Panel"
                  >
                    <i className="ti-info-alt"></i>
                    <span className="d-none d-lg-inline ms-1">Info</span>
                  </Button>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={toggleFullscreen}
                    title={
                      isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
                    }
                  >
                    <i
                      className={`ti-${
                        isFullscreen ? "zoom-out" : "fullscreen"
                      }`}
                    ></i>
                    <span className="d-none d-lg-inline ms-1">
                      {isFullscreen ? "Exit" : "Full"}
                    </span>
                  </Button>

                  {layouts.length > 1 && (
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="success"
                        size="sm"
                        title="Layout Selector"
                      >
                        <i className="ti-layers-alt"></i>
                        <span className="d-none d-lg-inline ms-1">Layout</span>
                      </Dropdown.Toggle>
                      <Dropdown.Menu align="end">
                        {layouts.map((layout) => (
                          <Dropdown.Item
                            key={layout.id}
                            active={layout.id === selectedLayout?.id}
                            onClick={() => setSelectedLayout(layout)}
                          >
                            <i className="ti-check me-2 text-success"></i>
                            {layout.name}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  )}

                  <Button
                    variant="outline-dark"
                    size="sm"
                    onClick={() => router.push("/farm-dashboard")}
                    title="Back to Dashboard"
                  >
                    <i className="ti-arrow-left"></i>
                    <span className="d-none d-lg-inline ms-1">Back</span>
                  </Button>
                </div>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Main Farm Grid - Full Screen */}
        <div className="farm-grid-container">
          <div className="farm-grid-wrapper">
            <PureCSSGridFarm
              farmId={farmId}
              selectedLayoutId={selectedLayout?.id}
              onTreeClick={handleTreeClick}
              showExpandButtons={true}
              showHeader={false}
              zoom={zoom}
              refreshKey={refreshKey}
              trees={trees}
            />
          </div>
        </div>

        {/* Info Sidebar */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          placement="end"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              <i className="ti-info-alt text-primary me-2"></i>
              Farm Information
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {/* Quick Stats - Mobile View */}
            <Card className="mb-3 border-0 bg-light d-lg-none">
              <Card.Body>
                <h6 className="card-title text-primary">
                  <i className="ti-dashboard me-2"></i>
                  Quick Stats
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  <Badge bg="primary" className="fs-6 py-2 px-3">
                    <i className="ti-stats-up me-1"></i>
                    {stats.totalTrees} Trees
                  </Badge>
                  <Badge bg="success" className="fs-6 py-2 px-3">
                    <i className="ti-check me-1"></i>
                    {stats.healthyTrees} Healthy
                  </Badge>
                  {stats.fruitingTrees > 0 && (
                    <Badge bg="warning" className="fs-6 py-2 px-3">
                      <i className="ti-gift me-1"></i>
                      {stats.fruitingTrees} Fruiting
                    </Badge>
                  )}
                  {stats.diseasedTrees > 0 && (
                    <Badge bg="danger" className="fs-6 py-2 px-3">
                      <i className="ti-alert me-1"></i>
                      {stats.diseasedTrees} Issues
                    </Badge>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Layout Info */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="card-title text-success">
                  <i className="ti-layout-grid3 me-2"></i>
                  Current Layout
                </h6>
                <p className="card-text">
                  <strong>{selectedLayout?.name}</strong>
                  <br />
                  <small className="text-muted">
                    {selectedLayout?.description}
                  </small>
                </p>
              </Card.Body>
            </Card>

            {/* Zoom Controls - Mobile View */}
            <Card className="mb-3 border-0 bg-light d-md-none">
              <Card.Body>
                <h6 className="card-title text-secondary">
                  <i className="ti-zoom-in me-2"></i>
                  Zoom Controls
                </h6>
                <div className="d-flex gap-2 align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                    className="flex-fill"
                  >
                    <i className="ti-zoom-out me-1"></i>
                    Out
                  </Button>
                  <Badge
                    bg="secondary"
                    className="px-2 py-2"
                    style={{ minWidth: "50px" }}
                  >
                    {(zoom * 100).toFixed(0)}%
                  </Badge>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setZoom(1)}
                    className="flex-fill"
                  >
                    <i className="ti-target me-1"></i>
                    Reset
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
                    className="flex-fill"
                  >
                    <i className="ti-zoom-in me-1"></i>
                    In
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Quick Actions */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="card-title text-primary">
                  <i className="ti-bolt me-2"></i>
                  Quick Actions
                </h6>
                <div className="d-grid gap-2">
                  <Button variant="success" size="sm" href="/trees">
                    <i className="ti-plus me-2"></i>
                    Manage Trees
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={fetchData}
                  >
                    <i className="ti-reload me-2"></i>
                    Refresh Data
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    href="/farm-dashboard"
                  >
                    <i className="ti-layout me-2"></i>
                    Dashboard View
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Tree Statistics */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="card-title text-warning">
                  <i className="ti-bar-chart me-2"></i>
                  Tree Statistics
                </h6>
                <div className="row g-2">
                  <div className="col-6">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="h5 text-primary mb-0">
                        {stats.totalTrees}
                      </div>
                      <small className="text-muted">Total</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="h5 text-success mb-0">
                        {stats.healthyTrees}
                      </div>
                      <small className="text-muted">Healthy</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="h5 text-warning mb-0">
                        {stats.fruitingTrees}
                      </div>
                      <small className="text-muted">Fruiting</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="h5 text-danger mb-0">
                        {stats.diseasedTrees}
                      </div>
                      <small className="text-muted">Issues</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Legend */}
            <Card className="border-0 bg-light">
              <Card.Body>
                <h6 className="card-title text-info">
                  <i className="ti-palette me-2"></i>
                  Legend
                </h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle me-2 border"
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#28a745",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "700",
                      }}
                    >
                      T
                    </div>
                    <small>Planted Trees</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle border me-2"
                      style={{
                        width: "16px",
                        height: "16px",
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "2px solid #28a745",
                      }}
                    ></div>
                    <small>Planting Guides</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div
                      className="me-2"
                      style={{
                        width: "20px",
                        height: "2px",
                        backgroundColor: "rgba(40, 167, 69, 0.3)",
                      }}
                    ></div>
                    <small>Grid Lines (1ft)</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Plant Tree Modal */}
        <PlantTreeModal
          show={showPlantModal}
          onHide={() => setShowPlantModal(false)}
          selectedPosition={selectedPosition}
          trees={trees}
          farmId={farmId}
          selectedLayout={selectedLayout}
          onTreePlanted={handleTreePlanted}
          initialFormData={initialPlantFormData}
        />

        {/* Enhanced Tree Details Modal */}
        <EnhancedTreeDetailsModal
          key={selectedTree?.id || "no-tree"}
          show={showTreeModal}
          onHide={() => setShowTreeModal(false)}
          selectedTree={selectedTree}
          selectedPosition={selectedPosition}
          onTreeUpdated={async () => {
            // Close the tree details modal
            setShowTreeModal(false);
            // Clear selected tree to prevent showing stale data
            setSelectedTree(null);
            // Refresh data and grid
            await fetchTrees();
            setRefreshKey((prev) => prev + 1);
          }}
          farmId={farmId}
          layoutId={selectedLayout?.id}
        />
      </div>
    </AdminGuard>
  );
}
