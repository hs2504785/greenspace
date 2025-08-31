"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Badge,
  InputGroup,
  Dropdown,
  ButtonGroup,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import { getTreeType } from "../../utils/treeTypeClassifier";

// Predefined tree types - always available
const PREDEFINED_TREES = [
  { code: "M", name: "Mango" },
  { code: "L", name: "Lemon" },
  { code: "AS", name: "All Spices" },
  { code: "A", name: "Apple" },
  { code: "CA", name: "Custard Apple" },
  { code: "G", name: "Guava" },
  { code: "AN", name: "Anjeer" },
  { code: "P", name: "Pomegranate" },
  { code: "MB", name: "Mulberry" },
  { code: "JA", name: "Jackfruit" },
  { code: "BC", name: "Barbadoos Cherry" },
  { code: "AV", name: "Avocado" },
  { code: "SF", name: "Starfruit" },
  { code: "C", name: "Cashew" },
  { code: "PR", name: "Pear" },
  { code: "PC", name: "Peach" },
  { code: "SP", name: "Sapota" },
  { code: "MR", name: "Moringa" },
  { code: "BB", name: "Black Berry" },
  { code: "LC", name: "Lychee" },
  { code: "MF", name: "Miracle Fruit" },
  { code: "KR", name: "Karoda" },
  { code: "AB", name: "Apple Ber" },
  { code: "BA", name: "Banana" },
  { code: "PA", name: "Papaya" },
  { code: "GR", name: "Grape" },
];

const PlantTreeModal = ({
  show,
  onHide,
  selectedPosition,
  trees,
  farmId,
  selectedLayout,
  onTreePlanted,
  initialFormData,
}) => {
  const [plantFormData, setPlantFormData] = useState({
    code: "",
    name: "",
    scientific_name: "",
    variety: "",
    status: "healthy",
  });

  const [matchedTree, setMatchedTree] = useState(null); // Store matched existing tree

  // Get all available trees (predefined + custom from database)
  const getAllAvailableTrees = () => {
    const allTrees = [];

    // Add predefined trees
    PREDEFINED_TREES.forEach((predefined) => {
      const existingTree = trees.find((t) => t.code === predefined.code);
      if (existingTree) {
        // Tree exists in database - use database version
        allTrees.push({
          ...existingTree,
          isPredefined: true,
        });
      } else {
        // Predefined tree not in database yet
        allTrees.push({
          id: `predefined-${predefined.code}`,
          code: predefined.code,
          name: predefined.name,
          isPredefined: true,
          isNew: true,
          tree_positions: [],
        });
      }
    });

    // Add custom trees that aren't in predefined list
    trees.forEach((tree) => {
      const isPredefined = PREDEFINED_TREES.some((p) => p.code === tree.code);
      if (!isPredefined) {
        allTrees.push({
          ...tree,
          isPredefined: false,
        });
      }
    });

    return allTrees.sort((a, b) => {
      // Sort by availability first, then by code
      const aPlanted = (a.tree_positions?.length || 0) > 0;
      const bPlanted = (b.tree_positions?.length || 0) > 0;
      if (aPlanted !== bPlanted) {
        return aPlanted ? 1 : -1; // Available first
      }
      return a.code.localeCompare(b.code);
    });
  };

  // Get position-based tree suggestions using visual classification system
  const getPositionBasedSuggestions = () => {
    if (!selectedPosition) return { type: "general", trees: [] };

    const { x, y } = selectedPosition;

    // Use the same classification system as the visual circles
    const treeType = getTreeType(x, y, 24, 24);

    const treeDatabase = {
      M: "Mango",
      L: "Lemon",
      AS: "All Spices",
      A: "Apple",
      CA: "Custard Apple",
      G: "Guava",
      AN: "Anjeer",
      P: "Pomegranate",
      MB: "Mulberry",
      JA: "Jackfruit",
      BC: "Barbadoos Cherry",
      AV: "Avocado",
      SF: "Starfruit",
      C: "Cashew",
      PR: "Pear",
      PC: "Peach",
      SP: "Sapota",
      MR: "Moringa",
      BB: "Black Berry",
      LC: "Lychee",
      MF: "Miracle Fruit",
      KR: "Karoda",
      AB: "Apple Ber",
      BA: "Banana",
      PA: "Papaya",
      GR: "Grape",
      OR: "Orange",
      CO: "Coconut",
      AM: "Amla",
      NE: "Neem",
    };

    let positionType, preferredCodes;

    switch (treeType) {
      case "big":
        positionType = "Corner Position (Big Trees)";
        preferredCodes = ["M", "JA", "CA", "A", "AV", "CO"];
        break;
      case "centerBig":
        positionType = "Center Position (Big Trees)";
        preferredCodes = ["M", "JA", "CA", "A", "AV", "CO"];
        break;
      case "medium":
        positionType = "Mid-Edge Position (Medium Trees)";
        preferredCodes = ["G", "L", "P", "C", "MR", "NE"];
        break;
      case "small":
        positionType = "Quarter Position (Small Trees)";
        preferredCodes = ["AN", "SF", "BC", "LC", "MF", "AM", "OR"];
        break;
      case "tiny":
      default:
        positionType = "Other Position (Tiny Trees)";
        preferredCodes = ["AM", "OR", "BB", "LC", "MF", "BC", "SF"];
        break;
    }

    const suggestedTrees = preferredCodes.map((code) => ({
      code,
      name: treeDatabase[code],
    }));

    const allTrees = Object.entries(treeDatabase).map(([code, name]) => ({
      code,
      name,
    }));

    return {
      type: positionType,
      suggested: suggestedTrees,
      all: allTrees,
    };
  };

  const [codeValidation, setCodeValidation] = useState({
    isChecking: false,
    isValid: true,
    message: "",
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (show) {
      // Reset form when modal opens
      setPlantFormData({
        code: "",
        name: "",
        scientific_name: "",
        variety: "",
        status: "healthy",
      });

      setMatchedTree(null);

      // Reset validation state
      setCodeValidation({
        isChecking: false,
        isValid: true,
        message: "",
      });
    }
  }, [show]);

  // Handle tree code changes - detect existing vs new
  const handleCodeChange = useCallback(
    (value) => {
      const upperCode = value.toUpperCase();

      setPlantFormData((prev) => ({
        ...prev,
        code: upperCode,
      }));

      if (upperCode.trim()) {
        // Check all available trees (predefined + existing)
        const allTrees = getAllAvailableTrees();
        const existingTree = allTrees.find((tree) => tree.code === upperCode);

        if (existingTree) {
          // Found existing tree - populate form and mark as matched
          setMatchedTree(existingTree);
          setPlantFormData((prev) => ({
            ...prev,
            code: upperCode,
            name: existingTree.name,
            scientific_name: existingTree.scientific_name || "",
            variety: existingTree.variety || "",
            status: existingTree.status || "healthy",
          }));
          setCodeValidation({
            isChecking: false,
            isValid: true,
            message: `Using existing: ${existingTree.name}`,
          });
        } else {
          // New tree code
          setMatchedTree(null);
          setCodeValidation({
            isChecking: false,
            isValid: true,
            message: "Will create new tree",
          });
        }
      } else {
        setMatchedTree(null);
        setCodeValidation({
          isChecking: false,
          isValid: true,
          message: "",
        });
      }
    },
    [trees]
  );

  const handleNameChange = useCallback((value) => {
    setMatchedTree(null); // Clear matched tree when manually changing name
    setPlantFormData((prev) => ({
      ...prev,
      name: value,
    }));
  }, []);

  const handleScientificNameChange = useCallback((value) => {
    setPlantFormData((prev) => ({
      ...prev,
      scientific_name: value,
    }));
  }, []);

  const handleVarietyChange = useCallback((value) => {
    setPlantFormData((prev) => ({
      ...prev,
      variety: value,
    }));
  }, []);

  const handlePlantTree = async (e) => {
    e.preventDefault();

    try {
      if (!selectedPosition) {
        toast.error("Please select a position to plant the tree");
        return;
      }

      if (!plantFormData.code || !plantFormData.name) {
        toast.error("Please provide tree code and name");
        return;
      }

      let treeToPlant;

      if (matchedTree && !matchedTree.isNew) {
        // Existing tree from database - create position only
        const positionData = {
          tree_id: matchedTree.id,
          layout_id: selectedLayout?.id,
          grid_x: selectedPosition.x,
          grid_y: selectedPosition.y,
          block_index: selectedPosition.blockIndex,
        };

        const positionResponse = await fetch("/api/tree-positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(positionData),
        });

        if (!positionResponse.ok) {
          const errorText = await positionResponse.text();
          let errorMessage = "Failed to plant existing tree";

          if (positionResponse.status === 409) {
            errorMessage =
              "This position is already occupied or tree is already planted in this layout.";
          } else {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorText;
            } catch {
              errorMessage = errorText || "Failed to plant existing tree";
            }
          }

          throw new Error(errorMessage);
        }

        const positionResult = await positionResponse.json();
        treeToPlant = positionResult.trees; // API returns tree info in trees field
      } else {
        // Create new tree (either completely new or predefined)
        const treeData = {
          code: plantFormData.code,
          name: plantFormData.name,
          scientific_name: plantFormData.scientific_name,
          variety: plantFormData.variety,
          status: plantFormData.status,
          farm_id: farmId,
          position: {
            layout_id: selectedLayout?.id,
            block_index: selectedPosition.blockIndex,
            grid_x: selectedPosition.x,
            grid_y: selectedPosition.y,
          },
        };

        const response = await fetch("/api/trees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(treeData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = "Failed to create tree";

          if (response.status === 409) {
            errorMessage = `Tree code '${treeData.code}' already exists. Please use a different code.`;
          } else {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorText;
            } catch {
              errorMessage = errorText || "Failed to create tree";
            }
          }

          throw new Error(errorMessage);
        }

        treeToPlant = await response.json();
      }

      const treeName = treeToPlant?.code || treeToPlant?.name || "Tree";
      toast.success(`${treeName} planted successfully!`);
      onHide();

      // Pass the new tree data back for immediate UI update
      if (onTreePlanted) {
        onTreePlanted(treeToPlant);
      }
    } catch (error) {
      console.error("Error planting tree:", error);
      toast.error(error.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <i className="ti-plus me-2"></i>
          Plant New Tree
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handlePlantTree}>
        <Modal.Body>
          <Alert variant="info" className="border-0">
            <i className="ti-location-pin me-2"></i>
            <strong>Position:</strong> Block{" "}
            {(selectedPosition?.blockIndex || 0) + 1}, Grid (
            {selectedPosition?.x}, {selectedPosition?.y})
          </Alert>

          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="ti-info-alt text-primary"></i>
              <small className="text-muted">
                Type tree code - will use existing tree if found, create new if
                not found.
                {getAllAvailableTrees().length} tree types available.
              </small>
            </div>
          </div>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex justify-content-between align-items-center">
                  <span>Tree Code</span>
                  {plantFormData.code && (
                    <Badge
                      bg={codeValidation.isValid ? "success" : "info"}
                      className="ms-2"
                    >
                      <i
                        className={`ti-${matchedTree ? "check" : "plus"} me-1`}
                      ></i>
                      {codeValidation.message}
                    </Badge>
                  )}
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={plantFormData.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    required
                    className={`fw-semibold ${
                      plantFormData.code && matchedTree
                        ? "is-valid"
                        : plantFormData.code && !matchedTree
                        ? "is-warning"
                        : ""
                    }`}
                    placeholder="Type tree code (e.g., M, SF, A)"
                  />
                  <Dropdown as={ButtonGroup}>
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      id="tree-code-dropdown"
                      title="Choose tree code"
                    >
                      <i className="ti-list"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        minWidth: "280px",
                      }}
                    >
                      {(() => {
                        const positionSuggestions =
                          getPositionBasedSuggestions();
                        const existingCodes = trees.map((t) => t.code);

                        return (
                          <>
                            <Dropdown.Header className="d-flex align-items-center">
                              <i className="ti-target me-2 text-primary"></i>
                              <strong>{positionSuggestions.type}</strong>
                            </Dropdown.Header>

                            {positionSuggestions.suggested?.map((tree) => {
                              // Find next available number for this code
                              let num = 1;
                              let availableCode = tree.code;
                              while (existingCodes.includes(availableCode)) {
                                availableCode = `${tree.code}${num}`;
                                num++;
                              }

                              return (
                                <Dropdown.Item
                                  key={tree.code}
                                  onClick={() => {
                                    handleCodeChange(availableCode);
                                  }}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  <div>
                                    <strong className="text-success">
                                      {availableCode}
                                    </strong>
                                    <span className="ms-2 text-muted">
                                      {tree.name}
                                    </span>
                                  </div>
                                  <Badge bg="success" className="ms-2">
                                    Suggested
                                  </Badge>
                                </Dropdown.Item>
                              );
                            })}

                            <Dropdown.Divider />

                            <Dropdown.Header className="d-flex align-items-center">
                              <i className="ti-list me-2 text-secondary"></i>
                              <strong>All Available Tree Codes</strong>
                            </Dropdown.Header>

                            {positionSuggestions.all?.map((tree) => {
                              // Find next available number for this code
                              let num = 1;
                              let availableCode = tree.code;
                              while (existingCodes.includes(availableCode)) {
                                availableCode = `${tree.code}${num}`;
                                num++;
                              }

                              return (
                                <Dropdown.Item
                                  key={`all-${tree.code}`}
                                  onClick={() => {
                                    handleCodeChange(availableCode);
                                  }}
                                  className="d-flex justify-content-between align-items-center py-1"
                                >
                                  <div>
                                    <strong className="text-primary">
                                      {availableCode}
                                    </strong>
                                    <span className="ms-2 text-muted small">
                                      {tree.name}
                                    </span>
                                  </div>
                                </Dropdown.Item>
                              );
                            })}
                          </>
                        );
                      })()}
                    </Dropdown.Menu>
                  </Dropdown>
                </InputGroup>

                {(() => {
                  const positionSuggestions = getPositionBasedSuggestions();
                  return (
                    !plantFormData.code && (
                      <Form.Text className="text-muted">
                        <i className="ti-target me-1"></i>
                        <strong>{positionSuggestions.type}</strong> - Click
                        dropdown to see suggested trees for this location
                      </Form.Text>
                    )
                  );
                })()}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tree Name</Form.Label>
                <Form.Control
                  type="text"
                  value={plantFormData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  readOnly={matchedTree}
                  className={matchedTree ? "bg-light" : ""}
                />
                {matchedTree && (
                  <Form.Text className="text-muted">
                    <i className="ti-lock me-1"></i>
                    Using existing tree details
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Scientific Name</Form.Label>
                <Form.Control
                  type="text"
                  value={plantFormData.scientific_name}
                  onChange={(e) => handleScientificNameChange(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Variety</Form.Label>
                <Form.Control
                  type="text"
                  value={plantFormData.variety}
                  onChange={(e) => handleVarietyChange(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="success"
            type="submit"
            className="px-4"
            disabled={!plantFormData.code || !plantFormData.name}
          >
            <i className="ti-plus me-2"></i>
            Plant Tree
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PlantTreeModal;
