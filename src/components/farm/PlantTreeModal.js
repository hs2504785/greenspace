"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { toast } from "react-hot-toast";

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

  // Update form data when modal opens with new data
  useEffect(() => {
    if (show && initialFormData) {
      setPlantFormData(initialFormData);
    }
  }, [show, initialFormData]);

  // Optimized form handlers using useCallback to prevent unnecessary re-renders
  const handleTreeIdChange = useCallback((value) => {
    setPlantFormData((prev) => ({ ...prev, tree_id: value }));
  }, []);

  const handleNewTreeCodeChange = useCallback((value) => {
    setPlantFormData((prev) => ({
      ...prev,
      new_tree: { ...prev.new_tree, code: value },
    }));
  }, []);

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
          const errorMessage =
            response.status === 409
              ? "A tree with this code already exists"
              : errorText || "Failed to create tree";
          throw new Error(errorMessage);
        }

        treeToPlant = await response.json();
      }

      toast.success(`Tree ${treeToPlant.code} planted successfully!`);
      onHide();
      if (onTreePlanted) {
        onTreePlanted();
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
                  <Form.Label>Tree Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={plantFormData.new_tree.code}
                    onChange={(e) => handleNewTreeCodeChange(e.target.value)}
                    required
                    className="fw-semibold"
                  />
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
          <Button variant="success" type="submit" className="px-4">
            <i className="ti-plus me-2"></i>
            Plant Tree
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PlantTreeModal;
