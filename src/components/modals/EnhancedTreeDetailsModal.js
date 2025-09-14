"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Badge,
  Row,
  Col,
  Card,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import EditTreeModal from "./EditTreeModal";
import GPSCaptureModal from "../farm/GPSCaptureModal";
import EnhancedTreeHistoryModal from "./EnhancedTreeHistoryModal";

const EnhancedTreeDetailsModal = ({
  show,
  onHide,
  selectedTree,
  selectedPosition,
  onTreeUpdated,
  onTreeDeleted,
  farmId,
  layoutId,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusOptions = [
    { value: "healthy", label: "Healthy", variant: "success" },
    { value: "diseased", label: "Diseased", variant: "danger" },
    { value: "fruiting", label: "Fruiting", variant: "warning" },
    { value: "dormant", label: "Dormant", variant: "secondary" },
    { value: "dead", label: "Dead", variant: "dark" },
  ];

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
  };

  const handleDeleteClick = () => {
    if (!selectedTree || !selectedTree.id) {
      console.error("No tree position ID available for deletion");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tree-positions/${selectedTree.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete tree");
      }

      // Call the callback to refresh the parent component
      if (onTreeDeleted) {
        onTreeDeleted(selectedTree, selectedPosition);
      }

      // Close the modal
      onHide();

      // Show success message
      toast.success("Tree deleted successfully!");
    } catch (error) {
      console.error("Error deleting tree:", error);
      toast.error(`Failed to delete tree: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (plantingDate) => {
    if (!plantingDate) return "Unknown";
    const planted = new Date(plantingDate);
    const now = new Date();
    const ageInDays = Math.floor((now - planted) / (1000 * 60 * 60 * 24));

    if (ageInDays < 30) return `${ageInDays} days`;
    if (ageInDays < 365) return `${Math.floor(ageInDays / 30)} months`;
    return `${Math.floor(ageInDays / 365)} years`;
  };

  const getExpectedHarvestDate = (plantingDate, yearsToFruit) => {
    if (!plantingDate || !yearsToFruit) return "Not calculated";
    const planted = new Date(plantingDate);
    planted.setFullYear(planted.getFullYear() + yearsToFruit);
    return planted.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  if (!selectedTree) return null;

  const currentStatus = statusOptions.find(
    (s) => s.value === selectedTree.status
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="bg-light border-bottom-0">
        <Modal.Title className="d-flex align-items-center">
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
            <h4 className="mb-0">{selectedTree.name}</h4>
            <small className="text-muted">
              Block {(selectedPosition?.blockIndex || 0) + 1}, Position (
              {selectedPosition?.x}, {selectedPosition?.y})
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        <Row>
          {/* Tree Type Information (Left Column) */}
          <Col lg={6}>
            <Card className="mb-3 border-0 bg-light h-100">
              <Card.Header className="bg-primary text-white py-2">
                <small>
                  <strong>Tree Type Information</strong>
                </small>
              </Card.Header>
              <Card.Body className="py-3">
                <div className="mb-3">
                  <strong>Code:</strong>{" "}
                  <Badge bg="secondary" className="ms-1">
                    {selectedTree.code}
                  </Badge>
                </div>
                <div className="mb-3">
                  <strong>Name:</strong> {selectedTree.name}
                </div>
                <div className="mb-3">
                  <strong>Category:</strong>{" "}
                  <Badge bg="info" className="ms-1">
                    {selectedTree.category?.replace(/^\w/, (c) =>
                      c.toUpperCase()
                    )}
                  </Badge>
                </div>
                <div className="mb-3">
                  <strong>Season:</strong>{" "}
                  <Badge bg="warning" className="ms-1">
                    {selectedTree.season?.replace(/^\w/, (c) =>
                      c.toUpperCase()
                    )}
                  </Badge>
                </div>
                <div className="mb-3">
                  <strong>Mature Height:</strong>{" "}
                  {selectedTree.mature_height?.replace(/^\w/, (c) =>
                    c.toUpperCase()
                  )}
                </div>
                <div className="mb-3">
                  <strong>Years to Fruit:</strong> {selectedTree.years_to_fruit}{" "}
                  years
                </div>
                {selectedTree.description && (
                  <div>
                    <strong>Description:</strong>
                    <p className="mb-0 mt-1 small text-muted">
                      {selectedTree.description}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* This Tree's Information (Right Column) */}
          <Col lg={6}>
            <Card className="mb-3 border-0 bg-light h-100">
              <Card.Header className="bg-success text-white py-2">
                <small>
                  <strong>This Tree's Information</strong>
                </small>
              </Card.Header>
              <Card.Body className="py-3">
                {/* Variety */}
                <div className="mb-3">
                  <strong>Variety:</strong>
                  <span className="ms-2">
                    {selectedTree.variety || "Not specified"}
                  </span>
                </div>

                {/* Status */}
                <div className="mb-3">
                  <strong>Status:</strong>
                  <Badge
                    bg={currentStatus?.variant || "secondary"}
                    className="ms-2"
                  >
                    {currentStatus?.label || "Unknown"}
                  </Badge>
                </div>

                {/* Planting Date */}
                <div className="mb-3">
                  <strong>Planting Date:</strong>
                  <span className="ms-2">
                    {formatDate(selectedTree.planting_date)}
                  </span>
                </div>

                {/* Age */}
                <div className="mb-3">
                  <strong>Age:</strong>{" "}
                  <span className="text-info">
                    {calculateAge(selectedTree.planting_date)}
                  </span>
                </div>

                {/* Expected Harvest */}
                <div className="mb-3">
                  <strong>Expected First Harvest:</strong>
                  <br />
                  <small className="text-muted">
                    {getExpectedHarvestDate(
                      selectedTree.planting_date,
                      selectedTree.years_to_fruit
                    )}
                  </small>
                </div>

                {/* Notes */}
                {selectedTree.notes && (
                  <div className="mb-3">
                    <strong>Notes:</strong>
                    <p className="mb-0 mt-1 small text-muted">
                      {selectedTree.notes}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="bg-light d-flex justify-content-between align-items-center">
        {/* Quick Action Buttons */}
        <div className="d-flex gap-2">
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>View growth history with photos</Tooltip>}
          >
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
            >
              <i className="ti-camera"></i>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Add/Update GPS Location</Tooltip>}
          >
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowGPSModal(true)}
            >
              <i className="ti-location-pin"></i>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Water reminder</Tooltip>}
          >
            <Button variant="outline-info" size="sm">
              <i className="ti-heart"></i>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Mark as harvested</Tooltip>}
          >
            <Button variant="outline-warning" size="sm">
              <i className="ti-gift"></i>
            </Button>
          </OverlayTrigger>
        </div>

        {/* Main Action Buttons */}
        <div className="d-flex gap-2 align-items-center">
          <Button variant="outline-secondary" onClick={onHide}>
            <i className="ti-close me-1"></i>
            Close
          </Button>
          <Button
            variant="outline-danger"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            <i className={`${isDeleting ? "ti-reload" : "ti-trash"} me-1`}></i>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="primary" onClick={handleEditClick}>
            <i className="ti-pencil me-1"></i>
            Edit Details
          </Button>
          <Button
            variant="outline-primary"
            href={`/trees/${selectedTree.tree_id}`}
          >
            <i className="ti-link me-1"></i>
            Full Details
          </Button>
        </div>
      </Modal.Footer>

      {/* Edit Tree Modal */}
      <EditTreeModal
        show={showEditModal}
        onHide={handleEditModalClose}
        selectedTree={selectedTree}
        selectedPosition={selectedPosition}
        onTreeUpdated={onTreeUpdated}
        layoutId={layoutId}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <i className="ti-alert me-2"></i>
            Confirm Tree Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mb-3">
              <i
                className="ti-trash"
                style={{ fontSize: "3rem", color: "#dc3545" }}
              ></i>
            </div>
            <h5>Are you sure you want to delete this tree?</h5>
            <p className="text-muted mb-3">
              <strong>{selectedTree?.name}</strong> from Block{" "}
              {(selectedPosition?.blockIndex || 0) + 1}, Position (
              {selectedPosition?.x}, {selectedPosition?.y})
            </p>
            <div className="alert alert-warning">
              <i className="ti-info-alt me-2"></i>
              This action cannot be undone. The tree will be permanently removed
              from this location.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            <i className={`${isDeleting ? "ti-reload" : "ti-trash"} me-1`}></i>
            {isDeleting ? "Deleting..." : "Delete Tree"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Tree History Modal */}
      <EnhancedTreeHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        selectedTree={selectedTree}
        selectedPosition={selectedPosition}
      />

      {/* GPS Capture Modal */}
      <GPSCaptureModal
        show={showGPSModal}
        onHide={() => setShowGPSModal(false)}
        selectedTree={selectedTree}
        selectedPosition={selectedPosition}
        onLocationUpdated={(updatedPosition) => {
          // Refresh the parent component with updated location data
          if (onTreeUpdated) {
            onTreeUpdated(updatedPosition, selectedPosition);
          }
        }}
      />
    </Modal>
  );
};

export default EnhancedTreeDetailsModal;
