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
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import { getTreeType } from "../../utils/treeTypeClassifier";

// Note: Tree types are now managed through the database (/trees page)
// This component dynamically loads available trees from the database

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
  const [isPlanting, setIsPlanting] = useState(false); // Track planting state
  const [dropdownSearch, setDropdownSearch] = useState(""); // Search term for dropdown

  // Get all available trees from database only
  const getAllAvailableTrees = () => {
    // Return empty array if trees is not available yet
    if (!trees || !Array.isArray(trees)) {
      return [];
    }

    // Use only trees from database - no hardcoded predefined trees
    const result = trees
      .map((tree) => ({
        ...tree,
        isPredefined: false, // All trees from database are treated as custom
        isNew: false, // Already exists in database
      }))
      // Deduplicate by code to prevent duplicate keys in React
      .filter(
        (tree, index, arr) =>
          arr.findIndex((t) => t.code === tree.code) === index
      )
      .sort((a, b) => {
        // Sort by availability first, then by code
        const aPlanted = (a.tree_positions?.length || 0) > 0;
        const bPlanted = (b.tree_positions?.length || 0) > 0;
        if (aPlanted !== bPlanted) {
          return aPlanted ? 1 : -1; // Available first
        }
        return a.code.localeCompare(b.code);
      });

    return result;
  };

  // Get position-based tree suggestions using database trees
  const getPositionBasedSuggestions = () => {
    if (!selectedPosition) return { type: "general", trees: [] };

    const { x, y } = selectedPosition;
    const treeType = getTreeType(x, y, 24, 24);

    // Get all trees from database
    const allDbTrees = getAllAvailableTrees();

    // Return early if no trees available
    if (!allDbTrees || allDbTrees.length === 0) {
      return { type: "Loading tree data...", trees: [] };
    }

    // Create lookup map from database trees
    const treeMap = {};
    allDbTrees.forEach((tree) => {
      treeMap[tree.code] = tree.name;
    });

    let positionType, preferredCodes;

    // Suggest trees based on position and what's available in database
    switch (treeType) {
      case "big":
        positionType = "Corner Position (Big Trees)";
        preferredCodes = allDbTrees
          .filter((t) => t.mature_height === "large")
          .map((t) => t.code);
        break;
      case "centerBig":
        positionType = "Center Position (Big Trees)";
        preferredCodes = allDbTrees
          .filter((t) => t.mature_height === "large")
          .map((t) => t.code);
        break;
      case "medium":
        positionType = "Mid-Edge Position (Medium Trees)";
        preferredCodes = allDbTrees
          .filter((t) => t.mature_height === "medium")
          .map((t) => t.code);
        break;
      case "small":
        positionType = "Quarter Position (Small Trees)";
        preferredCodes = allDbTrees
          .filter((t) => t.mature_height === "small")
          .map((t) => t.code);
        break;
      case "tiny":
      default:
        positionType = "Other Position (Small Trees)";
        preferredCodes = allDbTrees
          .filter(
            (t) => t.mature_height === "small" || t.mature_height === "medium"
          )
          .map((t) => t.code);
        break;
    }

    // Fallback: if no trees match height criteria, show first 6 trees
    if (preferredCodes.length === 0) {
      preferredCodes = allDbTrees.slice(0, 6).map((t) => t.code);
    }

    // Deduplicate codes to prevent React key conflicts
    const uniquePreferredCodes = [...new Set(preferredCodes)];

    const suggestedTrees = uniquePreferredCodes
      .slice(0, 6)
      .map((code) => {
        const tree = allDbTrees.find((t) => t.code === code);
        return {
          code: tree?.code || code,
          name: tree?.name || treeMap[code] || "Unknown",
        };
      })
      .filter((t) => t.name !== "Unknown");

    return {
      type: positionType,
      suggested: suggestedTrees,
      all: allDbTrees.map((tree) => ({
        code: tree.code,
        name: tree.name,
      })),
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
      setDropdownSearch(""); // Reset search when modal opens
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
            variety: "", // Variety is for the specific instance, not the tree type
            category: existingTree.category || "",
            season: existingTree.season || "",
            years_to_fruit: existingTree.years_to_fruit || "",
            mature_height: existingTree.mature_height || "",
            description: existingTree.description || "",
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
    // Don't clear matchedTree - variety is specific to the instance, not the tree type
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

    // Prevent double submissions
    if (isPlanting) {
      return;
    }

    try {
      setIsPlanting(true);

      if (!selectedPosition) {
        toast.error("Please select a position to plant the tree");
        setIsPlanting(false);
        return;
      }

      if (!plantFormData.code || !plantFormData.name) {
        toast.error("Please provide tree code and name");
        setIsPlanting(false);
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
          variety: plantFormData.variety || null,
          status: "healthy",
          planting_date: new Date().toISOString().split("T")[0],
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
          category: plantFormData.category,
          season: plantFormData.season,
          years_to_fruit: plantFormData.years_to_fruit,
          mature_height: plantFormData.mature_height,
          description: plantFormData.description,
          farm_id: farmId,
          variety: plantFormData.variety, // Will be stored in tree_positions
          status: "healthy", // Instance status
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

      // Pass the new tree data back for immediate UI update
      if (onTreePlanted) {
        onTreePlanted(treeToPlant);
      }

      // Note: Don't call onHide() here - let the parent handle closing via handleTreePlanted
    } catch (error) {
      console.error("Error planting tree:", error);
      toast.error(error.message);
    } finally {
      setIsPlanting(false);
    }
  };

  // Create popover content for position information
  const positionPopover = (
    <Popover id="position-popover" className="shadow">
      <Popover.Header as="h3" className="bg-light">
        <i className="ti-location-pin me-2 text-success"></i>
        Tree Position Info
      </Popover.Header>
      <Popover.Body>
        <div className="mb-2">
          <strong className="text-success">Position:</strong> Block{" "}
          {(selectedPosition?.blockIndex || 0) + 1}, Grid ({selectedPosition?.x}
          , {selectedPosition?.y})
        </div>
        {(() => {
          const positionSuggestions = getPositionBasedSuggestions();
          return (
            <div>
              <strong className="text-primary">Recommended for:</strong>
              <br />
              <span className="text-muted">{positionSuggestions.type}</span>
              {positionSuggestions.trees &&
                positionSuggestions.trees.length > 0 && (
                  <>
                    <br />
                    <small className="text-info">
                      {positionSuggestions.trees.length} tree types available
                    </small>
                  </>
                )}
            </div>
          );
        })()}
      </Popover.Body>
    </Popover>
  );

  // Create "What happens?" popover similar to EditTreeModal
  const whatHappensPopover = (
    <Popover id="what-happens-popover">
      <Popover.Header>What happens when planting?</Popover.Header>
      <Popover.Body>
        <small>
          <strong>If tree code exists:</strong> Uses existing tree type data and
          creates new tree instance at this position.
          <br />
          <br />
          <strong>If tree code is new:</strong> Creates new tree type in
          database, then plants instance.
          <br />
          <br />
          <em>Available tree types: {getAllAvailableTrees()?.length || 0}</em>
        </small>
      </Popover.Body>
    </Popover>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center">
            <i className="ti-plus me-2"></i>
            <span>Plant New Tree</span>
            <OverlayTrigger placement="bottom" overlay={whatHappensPopover}>
              <div
                className="ms-2 d-inline-flex align-items-center justify-content-center rounded-circle bg-light bg-opacity-25"
                style={{
                  cursor: "help",
                  width: "20px",
                  height: "20px",
                  fontSize: "12px",
                }}
              >
                <i className="ti-help text-white"></i>
              </div>
            </OverlayTrigger>
          </div>
          <OverlayTrigger
            trigger={["hover", "focus"]}
            placement="bottom"
            overlay={positionPopover}
          >
            <Button
              variant="outline-light"
              size="sm"
              className="border-0"
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <i className="ti-location-pin"></i>
            </Button>
          </OverlayTrigger>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handlePlantTree}>
        <Modal.Body>
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
                        maxHeight: "350px",
                        overflowY: "auto",
                        minWidth: "320px",
                      }}
                    >
                      {/* Search Input */}
                      <div className="p-2 border-bottom">
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder="Search tree codes, names..."
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {(() => {
                        const positionSuggestions =
                          getPositionBasedSuggestions();

                        // Filter trees based on search term
                        const filterTrees = (trees) => {
                          if (!dropdownSearch.trim()) return trees;
                          const searchLower = dropdownSearch.toLowerCase();
                          return trees.filter(
                            (tree) =>
                              tree.code.toLowerCase().includes(searchLower) ||
                              tree.name.toLowerCase().includes(searchLower) ||
                              (tree.category &&
                                tree.category
                                  .toLowerCase()
                                  .includes(searchLower))
                          );
                        };

                        const filteredSuggested = filterTrees(
                          positionSuggestions.suggested || []
                        );
                        const filteredAll = filterTrees(
                          positionSuggestions.all || []
                        );

                        return (
                          <>
                            <Dropdown.Header className="d-flex align-items-center">
                              <i className="ti-target me-2 text-primary"></i>
                              <strong>{positionSuggestions.type}</strong>
                            </Dropdown.Header>

                            {filteredSuggested.map((tree) => {
                              return (
                                <Dropdown.Item
                                  key={`suggested-${tree.code}`}
                                  onClick={() => {
                                    handleCodeChange(tree.code);
                                    setDropdownSearch("");
                                  }}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  <div>
                                    <strong className="text-success">
                                      {tree.code}
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
                              <strong>All Available Tree Types</strong>
                            </Dropdown.Header>

                            {filteredAll.map((tree) => {
                              return (
                                <Dropdown.Item
                                  key={`all-${tree.code}`}
                                  onClick={() => {
                                    handleCodeChange(tree.code);
                                    setDropdownSearch("");
                                  }}
                                  className="d-flex justify-content-between align-items-center py-1"
                                >
                                  <div>
                                    <strong className="text-primary">
                                      {tree.code}
                                    </strong>
                                    <span className="ms-2 text-muted small">
                                      {tree.name}
                                    </span>
                                  </div>
                                </Dropdown.Item>
                              );
                            })}

                            {filteredSuggested.length === 0 &&
                              filteredAll.length === 0 &&
                              dropdownSearch && (
                                <div className="p-3 text-center text-muted">
                                  <i className="ti-search me-2"></i>
                                  No trees found matching "{dropdownSearch}"
                                </div>
                              )}
                          </>
                        );
                      })()}
                    </Dropdown.Menu>
                  </Dropdown>
                </InputGroup>

                {!plantFormData.code && (
                  <Form.Text className="text-muted">
                    <i className="ti-target me-1"></i>
                    Select from existing trees or type a new code
                  </Form.Text>
                )}
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
                <Form.Label>
                  Variety{" "}
                  <small className="text-muted">(for this specific tree)</small>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={plantFormData.variety}
                  onChange={(e) => handleVarietyChange(e.target.value)}
                  placeholder="e.g., Alphonso, Kesar, Dasheri"
                />
                <Form.Text className="text-muted">
                  Optional: Specify the variety for this individual tree
                </Form.Text>
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
                  <option value="spices">Spices</option>
                  <option value="herbs">Herbs</option>
                  <option value="medicinal">Medicinal</option>
                  <option value="roots">Roots & Rhizomes</option>
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
            disabled={!plantFormData.code || !plantFormData.name || isPlanting}
          >
            {isPlanting ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                Planting...
              </>
            ) : (
              <>
                <i className="ti-plus me-2"></i>
                Plant Tree
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PlantTreeModal;
