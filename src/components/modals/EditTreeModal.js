"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Badge,
  Row,
  Col,
  Alert,
  OverlayTrigger,
  Tooltip,
  Popover,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

const EditTreeModal = ({
  show,
  onHide,
  selectedTree,
  selectedPosition,
  onTreeUpdated,
  layoutId,
}) => {
  const [editData, setEditData] = useState({
    variety: "",
    status: "healthy",
    planting_date: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: "healthy", label: "Healthy", variant: "success" },
    { value: "diseased", label: "Diseased", variant: "danger" },
    { value: "fruiting", label: "Fruiting", variant: "warning" },
    { value: "dormant", label: "Dormant", variant: "secondary" },
    { value: "dead", label: "Dead", variant: "dark" },
  ];

  useEffect(() => {
    if (selectedTree && show) {
      // Initialize edit data with current tree position data
      setEditData({
        variety: selectedTree.variety || "",
        status: selectedTree.status || "healthy",
        planting_date: selectedTree.planting_date || "",
        notes: selectedTree.notes || "",
      });
    }
  }, [selectedTree, show]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedTree?.id || !layoutId) return;

    console.log("EditTreeModal - selectedTree:", selectedTree);
    console.log("EditTreeModal - selectedTree.id:", selectedTree.id);
    console.log("EditTreeModal - layoutId:", layoutId);

    setLoading(true);
    try {
      const response = await fetch(`/api/tree-positions/${selectedTree.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variety: editData.variety,
          status: editData.status,
          planting_date: editData.planting_date,
          notes: editData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update tree");
      }

      toast.success("Tree updated successfully!");
      if (onTreeUpdated) {
        // Close edit modal and trigger update
        onHide();
        // Small delay to ensure database update is committed
        setTimeout(() => {
          onTreeUpdated();
        }, 100);
      } else {
        onHide();
      }
    } catch (error) {
      console.error("Error updating tree:", error);

      // Check if it's a database schema error
      if (
        error.message &&
        (error.message.includes("Database schema needs to be updated") ||
          error.message.includes("Database migration required"))
      ) {
        toast.error(
          "Database migration required! Please run the SQL from MIGRATION_INSTRUCTIONS.md to add required columns to tree_positions table.",
          { duration: 10000 }
        );
      } else {
        toast.error(error.message || "Failed to update tree");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset edit data to original values
    setEditData({
      variety: selectedTree.variety || "",
      status: selectedTree.status || "healthy",
      planting_date: selectedTree.planting_date || "",
      notes: selectedTree.notes || "",
    });
    onHide();
  };

  if (!selectedTree) return null;

  return (
    <Modal
      show={show}
      onHide={handleCancel}
      size="md"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title
          className="d-flex align-items-center"
          style={{ lineHeight: 1.2 }}
        >
          <i className="ti-pencil me-2"></i>
          <span>Edit Tree Details</span>
          <OverlayTrigger
            placement="bottom"
            overlay={
              <Popover>
                <Popover.Header>What gets saved?</Popover.Header>
                <Popover.Body>
                  <small>
                    Changes will be saved to{" "}
                    <strong>this specific tree instance</strong> at this
                    position.
                    <br />
                    <br />
                    Tree type information (name, category, season) remains
                    unchanged.
                    <br />
                    <br />
                    <em>
                      If you get a "Database schema" error, run the migration
                      from MIGRATION_INSTRUCTIONS.md
                    </em>
                  </small>
                </Popover.Body>
              </Popover>
            }
          >
            <div
              className="ms-2 rounded-circle bg-white bg-opacity-25 text-white"
              style={{
                width: "22px",
                height: "22px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "help",
                fontSize: "14px",
                fontWeight: "bold",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              ?
            </div>
          </OverlayTrigger>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSaveChanges}>
        <Modal.Body className="p-4">
          {/* Tree Info Header */}
          <div className="mb-4 p-3 bg-light rounded">
            <div className="d-flex align-items-center">
              <span className="tree-icon me-3" style={{ fontSize: "1.5rem" }}>
                {selectedTree.category === "citrus"
                  ? "🍊"
                  : selectedTree.category === "tropical"
                  ? "🥭"
                  : selectedTree.category === "stone"
                  ? "🍑"
                  : selectedTree.category === "berry"
                  ? "🫐"
                  : selectedTree.category === "nut"
                  ? "🥥"
                  : "🌳"}
              </span>
              <div>
                <h5 className="mb-0">{selectedTree.name}</h5>
                <small className="text-muted">
                  Block {(selectedPosition?.blockIndex || 0) + 1}, Position (
                  {selectedPosition?.x}, {selectedPosition?.y}) • Code:{" "}
                  {selectedTree.code}
                </small>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <strong>Variety</strong>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        Specify the cultivar or variety of this specific tree
                        instance (e.g., Alphonso, Kesar, Dasheri)
                      </Tooltip>
                    }
                  >
                    <span
                      className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25"
                      style={{
                        cursor: "help",
                        width: "16px",
                        height: "16px",
                        fontSize: "10px",
                      }}
                    >
                      <i className="ti-help text-secondary"></i>
                    </span>
                  </OverlayTrigger>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={editData.variety}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      variety: e.target.value,
                    })
                  }
                  placeholder="e.g., Alphonso, Kesar"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <strong>Status</strong>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        Current health and growth status of this specific tree
                      </Tooltip>
                    }
                  >
                    <span
                      className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25"
                      style={{
                        cursor: "help",
                        width: "16px",
                        height: "16px",
                        fontSize: "10px",
                      }}
                    >
                      <i className="ti-help text-secondary"></i>
                    </span>
                  </OverlayTrigger>
                </Form.Label>
                <Form.Select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      status: e.target.value,
                    })
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <strong>Planting Date</strong>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        When was this specific tree planted at this location?
                      </Tooltip>
                    }
                  >
                    <span
                      className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25"
                      style={{
                        cursor: "help",
                        width: "16px",
                        height: "16px",
                        fontSize: "10px",
                      }}
                    >
                      <i className="ti-help text-secondary"></i>
                    </span>
                  </OverlayTrigger>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={editData.planting_date}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      planting_date: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <div className="mb-3">
                <Form.Label className="d-flex align-items-center">
                  <strong>Tree Type</strong>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        Tree type information (read-only) -{" "}
                        {selectedTree.mature_height} height,{" "}
                        {selectedTree.years_to_fruit} years to fruit
                      </Tooltip>
                    }
                  >
                    <span
                      className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-25"
                      style={{
                        cursor: "help",
                        width: "16px",
                        height: "16px",
                        fontSize: "10px",
                      }}
                    >
                      <i className="ti-info text-info"></i>
                    </span>
                  </OverlayTrigger>
                </Form.Label>
                <div>
                  <Badge bg="info" className="me-2">
                    {selectedTree.category?.replace(/^\w/, (c) =>
                      c.toUpperCase()
                    )}
                  </Badge>
                  <Badge bg="warning">
                    {selectedTree.season?.replace(/^\w/, (c) =>
                      c.toUpperCase()
                    )}
                  </Badge>
                </div>
              </div>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="d-flex align-items-center">
              <strong>Notes</strong>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    Personal notes, care instructions, observations, or
                    reminders about this specific tree
                  </Tooltip>
                }
              >
                <span
                  className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25"
                  style={{
                    cursor: "help",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                  }}
                >
                  <i className="ti-help text-secondary"></i>
                </span>
              </OverlayTrigger>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={editData.notes}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  notes: e.target.value,
                })
              }
              placeholder="Care instructions, observations, reminders..."
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            <i className="ti-close me-1"></i>
            Cancel
          </Button>
          <Button variant="success" type="submit" disabled={loading}>
            <i className="ti-check me-1"></i>
            {loading ? "Saving Changes..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditTreeModal;
