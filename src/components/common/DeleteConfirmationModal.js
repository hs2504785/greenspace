'use client';

import { Modal, Button } from 'react-bootstrap';

export default function DeleteConfirmationModal({ 
  show, 
  onHide, 
  onConfirm, 
  title, 
  message,
  loading 
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ti-trash text-danger me-2"></i>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Deleting...
            </>
          ) : (
            <>
              <i className="ti-trash me-1"></i>
              Delete
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
