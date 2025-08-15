"use client";

import { useState, useEffect } from "react";
import { Card, Button, Table } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import vegetableService from "@/services/VegetableService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VegetableForm from "./VegetableForm";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

export default function VegetableManagement() {
  const { data: session } = useSession();
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedVegetable, setSelectedVegetable] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEdit = (vegetable) => {
    setSelectedVegetable(vegetable);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedVegetable(null);
  };

  const handleDelete = (vegetable) => {
    setSelectedVegetable(vegetable);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await vegetableService.deleteVegetable(selectedVegetable.id);
      toast.success("Product deleted successfully");
      loadVegetables();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedVegetable(null);
    }
  };

  const loadVegetables = async () => {
    try {
      if (!session?.user?.id) {
        console.warn("No user ID in session");
        setVegetables([]);
        setLoading(false);
        return;
      }

      console.log("Loading vegetables for user:", {
        id: session.user.id,
        email: session.user.email,
      });

      // Always use the session user ID
      const data = await vegetableService.getVegetablesByOwner(session.user.id);
      console.log("Loaded vegetables:", data);
      setVegetables(data || []);
    } catch (error) {
      toast.error("Failed to load products");
      console.error("Error loading products:", error);
      setVegetables([]); // Reset vegetables on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session === null) {
      setLoading(false);
      return;
    }

    if (session?.user?.id) {
      loadVegetables();
    } else if (session) {
      console.warn("Session exists but no user ID, session:", session);
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">My Products</h5>
        <Button variant="success" size="sm" onClick={() => setShowForm(true)}>
          <i className="ti-plus me-1"></i>
          Add New Product
        </Button>
      </Card.Header>
      <Card.Body>
        {vegetables.length === 0 ? (
          <div className="text-center py-4">
            <i
              className="ti-package text-muted"
              style={{ fontSize: "3rem" }}
            ></i>
            <p className="mt-3 mb-0">No products added yet.</p>
            <Button
              variant="outline-success"
              size="sm"
              className="mt-3"
              onClick={() => setShowForm(true)}
            >
              Add Your First Product
            </Button>
          </div>
        ) : (
          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price (₹/kg)</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vegetables.map((vegetable) => (
                <tr key={vegetable.id}>
                  <td>{vegetable.name}</td>
                  <td>₹{vegetable.price}</td>
                  <td>{vegetable.quantity} kg</td>
                  <td>{vegetable.category}</td>
                  <td>{vegetable.location}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(vegetable)}
                    >
                      <i className="ti-pencil"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(vegetable)}
                    >
                      <i className="ti-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      <VegetableForm
        show={showForm}
        onHide={handleCloseForm}
        onSuccess={loadVegetables}
        vegetable={selectedVegetable}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete ${selectedVegetable?.name}? This action cannot be undone.`}
        isLoading={deleteLoading}
      />
    </Card>
  );
}
