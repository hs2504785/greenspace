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
    tree_id: "",
    new_tree: {
      code: "",
      name: "",
      scientific_name: "",
      variety: "",
      status: "healthy",
    },
  });

  const [suggestions, setSuggestions] = useState({
    code: "",
    name: "",
  });

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
      BC: "Barbados Cherry",
      AV: "Avocado",
      SF: "Starfruit",
      C: "Cashew",
      PR: "Pear",
      PH: "Peach",
      SP: "Sapota",
      MR: "Moringa",
      BB: "Blackberry",
      LC: "Lychee",
      MF: "Miracle Fruit",
      KR: "Karonda",
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

  // Update form data when modal opens with new data
  useEffect(() => {
    if (show && initialFormData) {
      setPlantFormData({
        tree_id: initialFormData.tree_id || "",
        new_tree: initialFormData.new_tree || {
          code: "",
          name: "",
          scientific_name: "",
          variety: "",
          status: "healthy",
        },
      });

      // Store suggestions separately
      if (initialFormData.suggestions) {
        setSuggestions(initialFormData.suggestions);
      }
    }
  }, [show, initialFormData]);

  // Optimized form handlers using useCallback to prevent unnecessary re-renders
  const handleTreeIdChange = useCallback((value) => {
    setPlantFormData((prev) => ({ ...prev, tree_id: value }));
  }, []);

  const handleNewTreeCodeChange = useCallback(
    (value) => {
      setPlantFormData((prev) => ({
        ...prev,
        new_tree: { ...prev.new_tree, code: value.toUpperCase() },
      }));

      // Validate code uniqueness in real-time
      if (value.trim()) {
        const codeExists = trees.some(
          (tree) => tree.code.toLowerCase() === value.toLowerCase()
        );
        setCodeValidation({
          isChecking: false,
          isValid: !codeExists,
          message: codeExists ? "This code already exists" : "Code available",
        });
      } else {
        setCodeValidation({
          isChecking: false,
          isValid: true,
          message: "",
        });
      }
    },
    [trees]
  );

  const handleNewTreeNameChange = useCallback((value) => {
    setPlantFormData((prev) => ({
      ...prev,
      new_tree: { ...prev.new_tree, name: value },
    }));
  }, []);

  const handleNewTreeScientificNameChange = useCallback((value) => {
    setPlantFormData((prev) => ({
      ...prev,
      new_tree: { ...prev.new_tree, scientific_name: value },
    }));
  }, []);

  const handleNewTreeVarietyChange = useCallback((value) => {
    setPlantFormData((prev) => ({
      ...prev,
      new_tree: { ...prev.new_tree, variety: value },
    }));
  }, []);

  const handlePlantTree = async (e) => {
    e.preventDefault();

    try {
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

      // Client-side validation for unique tree codes
      if (!plantFormData.tree_id && plantFormData.new_tree.code) {
        const codeExists = trees.some(
          (tree) =>
            tree.code.toLowerCase() ===
            plantFormData.new_tree.code.toLowerCase()
        );
        if (codeExists) {
          toast.error(
            `Tree code '${plantFormData.new_tree.code}' already exists. Please use a different code.`
          );
          return;
        }
      }

      let treeToPlant;

      if (plantFormData.tree_id) {
        treeToPlant = { id: plantFormData.tree_id };
      } else {
        const treeData = {
          ...plantFormData.new_tree,
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

      toast.success(
        `Tree ${treeToPlant.code || treeToPlant.name} planted successfully!`
      );
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
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                name="plantOption"
                id="new-tree"
                label="Create new tree"
                checked={plantFormData.tree_id === ""}
                onChange={() => handleTreeIdChange("")}
              />
              <Form.Check
                type="radio"
                name="plantOption"
                id="existing-tree"
                label="Use existing tree"
                checked={plantFormData.tree_id !== ""}
                onChange={() =>
                  handleTreeIdChange(
                    trees.filter((t) => !t.tree_positions?.length)[0]?.id || ""
                  )
                }
              />
            </div>
          </div>

          {plantFormData.tree_id !== "" ? (
            <Form.Group>
              <Form.Label>Select Existing Tree</Form.Label>
              <Form.Select
                value={plantFormData.tree_id}
                onChange={(e) => handleTreeIdChange(e.target.value)}
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex justify-content-between align-items-center">
                    <span>Tree Code</span>
                    {plantFormData.new_tree.code && (
                      <Badge
                        bg={codeValidation.isValid ? "success" : "danger"}
                        className="ms-2"
                      >
                        <i
                          className={`ti-${
                            codeValidation.isValid ? "check" : "close"
                          } me-1`}
                        ></i>
                        {codeValidation.message}
                      </Badge>
                    )}
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={plantFormData.new_tree.code}
                      onChange={(e) => handleNewTreeCodeChange(e.target.value)}
                      required
                      className={`fw-semibold ${
                        plantFormData.new_tree.code && !codeValidation.isValid
                          ? "is-invalid"
                          : plantFormData.new_tree.code &&
                            codeValidation.isValid
                          ? "is-valid"
                          : ""
                      }`}
                      placeholder="Type code or select from dropdown"
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
                                      handleNewTreeCodeChange(availableCode);
                                      handleNewTreeNameChange(tree.name);
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
                                      handleNewTreeCodeChange(availableCode);
                                      handleNewTreeNameChange(tree.name);
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
                  {!codeValidation.isValid && (
                    <Form.Text className="text-danger">
                      <i className="ti-alert me-1"></i>
                      Please choose a different code - this one is already in
                      use.
                    </Form.Text>
                  )}
                  {(() => {
                    const positionSuggestions = getPositionBasedSuggestions();
                    return (
                      !plantFormData.new_tree.code && (
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
                    value={plantFormData.new_tree.name}
                    onChange={(e) => handleNewTreeNameChange(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Scientific Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={plantFormData.new_tree.scientific_name}
                    onChange={(e) =>
                      handleNewTreeScientificNameChange(e.target.value)
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
                    onChange={(e) => handleNewTreeVarietyChange(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="success"
            type="submit"
            className="px-4"
            disabled={!codeValidation.isValid && plantFormData.tree_id === ""}
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
