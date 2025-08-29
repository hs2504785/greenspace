"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Nav,
  Tab,
  Badge,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import PureCSSGridFarm from "@/components/farm/PureCSSGridFarm";

export default function FarmDashboardPage() {
  const [activeTab, setActiveTab] = useState("grid");
  const [trees, setTrees] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [plantFormData, setPlantFormData] = useState({
    tree_id: "",
    new_tree: {
      code: "",
      name: "",
      scientific_name: "",
      variety: "",
      status: "healthy",
    },
  });

  // Use your existing user ID - in real app, get from authentication
  const farmId = "0e13a58b-a5e2-4ed3-9c69-9634c7413550";

  useEffect(() => {
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

  const handleTreeClick = (tree, position) => {
    setSelectedPosition(position);
    if (tree) {
      setSelectedTree(tree);
      setShowTreeModal(true);
    } else {
      // Empty position clicked - show plant modal with suggested values
      setSelectedTree(null);

      // Generate unique tree code for quick planting
      const treeCodes = [
        "M",
        "L",
        "AS",
        "A",
        "CA",
        "G",
        "AN",
        "P",
        "MB",
        "JA",
        "MU",
        "O",
        "B",
        "AV",
        "SF",
        "C",
        "AM",
        "PR",
        "MR",
        "SL",
        "KR",
        "BA",
        "PA",
        "GRP",
      ];
      const baseCode = treeCodes[Math.floor(Math.random() * treeCodes.length)];

      // Find next available number for this code type
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

      const uniqueCode =
        nextNumber === 1 ? baseCode : `${baseCode}${nextNumber}`;

      setPlantFormData({
        tree_id: "",
        new_tree: {
          code: uniqueCode,
          name: `${uniqueCode} Tree`,
          scientific_name: "",
          variety: "",
          status: "healthy",
        },
      });
      setShowPlantModal(true);
    }
  };

  const handlePlantTree = async (e) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!selectedPosition) {
        toast.error("Please select a position to plant the tree");
        return;
      }

      if (
        !plantFormData.tree_id &&
        (!plantFormData.new_tree.code || !plantFormData.new_tree.name)
      ) {
        toast.error("Please provide tree code and name");
        return;
      }

      let treeToPlant;

      if (plantFormData.tree_id) {
        // Use existing tree
        treeToPlant = { id: plantFormData.tree_id };
      } else {
        // Create new tree with position directly (simpler approach)
        const treeData = {
          ...plantFormData.new_tree,
          farm_id: farmId,
          position: {
            layout_id: selectedLayout?.id,
            grid_x: selectedPosition.x,
            grid_y: selectedPosition.y,
            block_index: selectedPosition.blockIndex,
          },
        };

        console.log("Creating tree with data:", treeData); // Debug log

        const response = await fetch("/api/trees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(treeData),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Tree creation failed:", response.status, errorData);

          // Parse error message for user-friendly display
          let errorMessage = `Failed to create tree (${response.status})`;
          try {
            const parsedError = JSON.parse(errorData);
            if (parsedError.error) {
              if (
                parsedError.error.includes(
                  "duplicate key value violates unique constraint"
                )
              ) {
                errorMessage = `Tree code '${treeData.code}' already exists. Please use a different code.`;
              } else {
                errorMessage = parsedError.error;
              }
            }
          } catch (e) {
            // Use generic message if JSON parsing fails
          }

          throw new Error(errorMessage);
        }

        treeToPlant = await response.json();
      }

      toast.success(
        `Tree ${treeToPlant.code} planted successfully at (${selectedPosition.x}, ${selectedPosition.y})!`
      );
      setShowPlantModal(false);

      // Reset form for next planting
      setPlantFormData({
        tree_id: "",
        new_tree: {
          code: "",
          name: "",
          scientific_name: "",
          variety: "",
          status: "healthy",
        },
      });

      await fetchTrees(); // Refresh the tree list
    } catch (error) {
      console.error("Error planting tree:", error);
      toast.error(error.message);
    }
  };

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
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading farm dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>Farm Dashboard</h2>
              <p className="text-muted mb-0">
                Manage your trees and farm layout
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="success" href="/trees">
                Manage Trees
              </Button>
              <Button variant="outline-primary" onClick={fetchData}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-primary">{stats.totalTrees}</h3>
                  <p className="mb-0">Total Trees</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-success">{stats.healthyTrees}</h3>
                  <p className="mb-0">Healthy Trees</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-warning">{stats.fruitingTrees}</h3>
                  <p className="mb-0">Fruiting Trees</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-danger">{stats.diseasedTrees}</h3>
                  <p className="mb-0">Diseased Trees</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Content Tabs */}
          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="grid">
                  <i className="bi bi-grid-3x3"></i> Farm Grid Layout
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="list">
                  <i className="bi bi-list-ul"></i> Tree List
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="grid">
                <PureCSSGridFarm
                  farmId={farmId}
                  selectedLayoutId={selectedLayout?.id}
                  onTreeClick={handleTreeClick}
                  showExpandButtons={true}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="list">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">All Trees</h5>
                  </Card.Header>
                  <Card.Body>
                    {trees.length === 0 ? (
                      <div className="text-center py-4">
                        <p>No trees planted yet.</p>
                        <Button variant="success" href="/trees">
                          Add Your First Tree
                        </Button>
                      </div>
                    ) : (
                      <Row>
                        {trees.map((tree) => (
                          <Col md={4} key={tree.id} className="mb-3">
                            <Card className="h-100">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <Badge bg="secondary" className="fs-6">
                                    {tree.code}
                                  </Badge>
                                  <Badge
                                    bg={
                                      tree.status === "healthy"
                                        ? "success"
                                        : tree.status === "diseased"
                                        ? "danger"
                                        : "warning"
                                    }
                                  >
                                    {tree.status}
                                  </Badge>
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
                                    {new Date(
                                      tree.planting_date
                                    ).toLocaleDateString()}
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
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>

      {/* Plant Tree Modal */}
      <Modal
        show={showPlantModal}
        onHide={() => setShowPlantModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Plant Tree</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePlantTree}>
          <Modal.Body>
            <Alert variant="info">
              <small>
                Position: Block {(selectedPosition?.blockIndex || 0) + 1}, Grid
                ({selectedPosition?.x}, {selectedPosition?.y})
              </small>
            </Alert>

            <div className="mb-3">
              <Form.Check
                type="radio"
                name="plantOption"
                id="existing-tree"
                label="Use existing tree"
                checked={plantFormData.tree_id !== ""}
                onChange={() =>
                  setPlantFormData((prev) => ({
                    ...prev,
                    tree_id: trees[0]?.id || "",
                  }))
                }
              />
              <Form.Check
                type="radio"
                name="plantOption"
                id="new-tree"
                label="Create new tree"
                checked={plantFormData.tree_id === ""}
                onChange={() =>
                  setPlantFormData((prev) => ({ ...prev, tree_id: "" }))
                }
              />
            </div>

            {plantFormData.tree_id !== "" ? (
              <Form.Group>
                <Form.Label>Select Tree</Form.Label>
                <Form.Select
                  value={plantFormData.tree_id}
                  onChange={(e) =>
                    setPlantFormData((prev) => ({
                      ...prev,
                      tree_id: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Choose a tree...</option>
                  {trees
                    .filter((t) => !t.tree_positions?.length)
                    .map((tree) => (
                      <option key={tree.id} value={tree.id}>
                        {tree.code} - {tree.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            ) : (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tree Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={plantFormData.new_tree.code}
                        onChange={(e) =>
                          setPlantFormData((prev) => ({
                            ...prev,
                            new_tree: {
                              ...prev.new_tree,
                              code: e.target.value,
                            },
                          }))
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tree Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={plantFormData.new_tree.name}
                        onChange={(e) =>
                          setPlantFormData((prev) => ({
                            ...prev,
                            new_tree: {
                              ...prev.new_tree,
                              name: e.target.value,
                            },
                          }))
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Scientific Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={plantFormData.new_tree.scientific_name}
                        onChange={(e) =>
                          setPlantFormData((prev) => ({
                            ...prev,
                            new_tree: {
                              ...prev.new_tree,
                              scientific_name: e.target.value,
                            },
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Variety</Form.Label>
                      <Form.Control
                        type="text"
                        value={plantFormData.new_tree.variety}
                        onChange={(e) =>
                          setPlantFormData((prev) => ({
                            ...prev,
                            new_tree: {
                              ...prev.new_tree,
                              variety: e.target.value,
                            },
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowPlantModal(false)}
            >
              Cancel
            </Button>
            <Button variant="success" type="submit">
              Plant Tree
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Tree Details Modal */}
      <Modal show={showTreeModal} onHide={() => setShowTreeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tree Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTree && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5>{selectedTree.name}</h5>
                <Badge bg="secondary">{selectedTree.code}</Badge>
              </div>
              <div className="mb-2">
                <strong>Scientific Name:</strong>{" "}
                {selectedTree.scientific_name || "Not specified"}
              </div>
              {selectedTree.variety && (
                <div className="mb-2">
                  <strong>Variety:</strong> {selectedTree.variety}
                </div>
              )}
              <div className="mb-2">
                <strong>Status:</strong>{" "}
                <Badge
                  bg={selectedTree.status === "healthy" ? "success" : "warning"}
                >
                  {selectedTree.status}
                </Badge>
              </div>
              {selectedTree.planting_date && (
                <div className="mb-2">
                  <strong>Planting Date:</strong>{" "}
                  {new Date(selectedTree.planting_date).toLocaleDateString()}
                </div>
              )}
              {selectedTree.description && (
                <div className="mb-2">
                  <strong>Description:</strong> {selectedTree.description}
                </div>
              )}
              <div className="mb-2">
                <strong>Position:</strong> Block{" "}
                {(selectedPosition?.blockIndex || 0) + 1}, Grid (
                {selectedPosition?.x}, {selectedPosition?.y})
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTreeModal(false)}>
            Close
          </Button>
          <Button variant="primary" href={`/trees`}>
            Edit Tree
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
