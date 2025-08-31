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

// Predefined tree types - always available with default properties
const PREDEFINED_TREES = [
  {
    code: "M",
    name: "Mango",
    category: "tropical",
    season: "summer",
    years_to_fruit: "3",
    mature_height: "large",
  },
  {
    code: "L",
    name: "Lemon",
    category: "citrus",
    season: "year-round",
    years_to_fruit: "2",
    mature_height: "medium",
  },
  {
    code: "AS",
    name: "All Spices",
    category: "exotic",
    season: "year-round",
    years_to_fruit: "4",
    mature_height: "medium",
  },
  {
    code: "A",
    name: "Apple",
    category: "stone",
    season: "winter",
    years_to_fruit: "3",
    mature_height: "medium",
  },
  {
    code: "CA",
    name: "Custard Apple",
    category: "tropical",
    season: "winter",
    years_to_fruit: "3",
    mature_height: "medium",
  },
  {
    code: "G",
    name: "Guava",
    category: "tropical",
    season: "year-round",
    years_to_fruit: "2",
    mature_height: "medium",
  },
  {
    code: "AN",
    name: "Anjeer",
    category: "stone",
    season: "summer",
    years_to_fruit: "3",
    mature_height: "medium",
  },
  {
    code: "P",
    name: "Pomegranate",
    category: "stone",
    season: "winter",
    years_to_fruit: "3",
    mature_height: "medium",
  },
  {
    code: "MB",
    name: "Mulberry",
    category: "berry",
    season: "summer",
    years_to_fruit: "2",
    mature_height: "large",
  },
  {
    code: "JA",
    name: "Jackfruit",
    category: "tropical",
    season: "summer",
    years_to_fruit: "5",
    mature_height: "large",
  },
  {
    code: "BC",
    name: "Barbadoos Cherry",
    category: "berry",
    season: "year-round",
    years_to_fruit: "2",
    mature_height: "small",
  },
  {
    code: "AV",
    name: "Avocado",
    category: "tropical",
    season: "year-round",
    years_to_fruit: "4",
    mature_height: "large",
  },
  {
    code: "SF",
    name: "Starfruit",
    category: "tropical",
    season: "year-round",
    years_to_fruit: "3",
    mature_height: "medium",
  },
  {
    code: "C",
    name: "Cashew",
    category: "nut",
    season: "summer",
    years_to_fruit: "5",
    mature_height: "large",
  },
  {
    code: "PR",
    name: "Pear",
    category: "stone",
    season: "winter",
    years_to_fruit: "3",
    mature_height: "medium",
  },
  {
    code: "PC",
    name: "Peach",
    category: "stone",
    season: "summer",
    years_to_fruit: "3",
    mature_height: "medium",
  },
  {
    code: "SP",
    name: "Sapota",
    category: "tropical",
    season: "year-round",
    years_to_fruit: "4",
    mature_height: "large",
  },
  {
    code: "MR",
    name: "Moringa",
    category: "exotic",
    season: "year-round",
    years_to_fruit: "1",
    mature_height: "medium",
  },
  {
    code: "BB",
    name: "Black Berry",
    category: "berry",
    season: "summer",
    years_to_fruit: "2",
    mature_height: "small",
  },
  {
    code: "LC",
    name: "Lychee",
    category: "tropical",
    season: "summer",
    years_to_fruit: "5",
    mature_height: "large",
  },
  {
    code: "MF",
    name: "Miracle Fruit",
    category: "exotic",
    season: "year-round",
    years_to_fruit: "3",
    mature_height: "small",
  },
  {
    code: "KR",
    name: "Karoda",
    category: "berry",
    season: "summer",
    years_to_fruit: "2",
    mature_height: "small",
  },
  {
    code: "AB",
    name: "Apple Ber",
    category: "stone",
    season: "winter",
    years_to_fruit: "3",
    mature_height: "medium",
  },
  {
    code: "BA",
    name: "Banana",
    category: "tropical",
    season: "year-round",
    years_to_fruit: "1",
    mature_height: "medium",
  },
  {
    code: "PA",
    name: "Papaya",
    category: "tropical",
    season: "year-round",
    years_to_fruit: "1",
    mature_height: "medium",
  },
  {
    code: "GR",
    name: "Grape",
    category: "berry",
    season: "summer",
    years_to_fruit: "2",
    mature_height: "medium",
  },
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
    variety: "",
    category: "",
    season: "",
    years_to_fruit: "",
    mature_height: "",
    description: "",
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
        variety: "",
        category: "",
        season: "",
        years_to_fruit: "",
        mature_height: "",
        description: "",
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
            variety: existingTree.variety || "",
            category: existingTree.category || "",
            season: existingTree.season || "",
            years_to_fruit: existingTree.years_to_fruit || "",
            mature_height: existingTree.mature_height || "",
            description: existingTree.description || "",
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

  const handleVarietyChange = useCallback((value) => {
    setMatchedTree(null); // Clear matched tree when manually changing variety
    setPlantFormData((prev) => ({
      ...prev,
      variety: value,
    }));
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setMatchedTree(null);
    setPlantFormData((prev) => ({
      ...prev,
      category: value,
    }));
  }, []);

  const handleSeasonChange = useCallback((value) => {
    setMatchedTree(null);
    setPlantFormData((prev) => ({
      ...prev,
      season: value,
    }));
  }, []);

  const handleYearsToFruitChange = useCallback((value) => {
    setMatchedTree(null);
    setPlantFormData((prev) => ({
      ...prev,
      years_to_fruit: value,
    }));
  }, []);

  const handleMatureHeightChange = useCallback((value) => {
    setMatchedTree(null);
    setPlantFormData((prev) => ({
      ...prev,
      mature_height: value,
    }));
  }, []);

  const handleDescriptionChange = useCallback((value) => {
    setMatchedTree(null);
    setPlantFormData((prev) => ({
      ...prev,
      description: value,
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
                <Form.Label>Variety</Form.Label>
                <Form.Control
                  type="text"
                  value={plantFormData.variety}
                  onChange={(e) => handleVarietyChange(e.target.value)}
                  placeholder="e.g., Alphonso, Kesar"
                  readOnly={matchedTree}
                  className={matchedTree ? "bg-light" : ""}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={plantFormData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={matchedTree}
                  className={matchedTree ? "bg-light" : ""}
                >
                  <option value="">Select Category</option>
                  <option value="citrus">Citrus</option>
                  <option value="stone">Stone Fruit</option>
                  <option value="tropical">Tropical</option>
                  <option value="berry">Berry</option>
                  <option value="nut">Nut</option>
                  <option value="exotic">Exotic</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Season</Form.Label>
                <Form.Select
                  value={plantFormData.season}
                  onChange={(e) => handleSeasonChange(e.target.value)}
                  disabled={matchedTree}
                  className={matchedTree ? "bg-light" : ""}
                >
                  <option value="">Select Season</option>
                  <option value="summer">Summer</option>
                  <option value="winter">Winter</option>
                  <option value="monsoon">Monsoon</option>
                  <option value="year-round">Year-round</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Years to Fruit</Form.Label>
                <Form.Control
                  type="number"
                  value={plantFormData.years_to_fruit}
                  onChange={(e) => handleYearsToFruitChange(e.target.value)}
                  placeholder="e.g., 3-5"
                  min="1"
                  max="20"
                  readOnly={matchedTree}
                  className={matchedTree ? "bg-light" : ""}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Mature Height</Form.Label>
                <Form.Select
                  value={plantFormData.mature_height}
                  onChange={(e) => handleMatureHeightChange(e.target.value)}
                  disabled={matchedTree}
                  className={matchedTree ? "bg-light" : ""}
                >
                  <option value="">Select Height</option>
                  <option value="small">Small (5-10 ft)</option>
                  <option value="medium">Medium (10-20 ft)</option>
                  <option value="large">Large (20+ ft)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={plantFormData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Care tips, notes, or additional details..."
                  readOnly={matchedTree}
                  className={matchedTree ? "bg-light" : ""}
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
