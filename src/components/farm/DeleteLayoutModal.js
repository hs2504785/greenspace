import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-hot-toast";

const DeleteLayoutModal = ({ show, onHide, layout, onConfirmDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!layout) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete(layout);
      onHide();
    } catch (error) {
      console.error("Error deleting layout:", error);
      toast.error("Failed to delete layout");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <i className="ti-trash text-danger"></i>
          Delete Layout
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">
          Are you sure you want to delete <strong>"{layout?.name}"</strong>?
          This action cannot be undone.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Deleting...
            </>
          ) : (
            <>
              <i className="ti-trash me-2"></i>
              Delete
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteLayoutModal;
