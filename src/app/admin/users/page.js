"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Badge,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import AdminGuard from "@/components/common/AdminGuard";
import UserAvatar from "@/components/common/UserAvatar";

export default function UsersManagement() {
  const { data: session } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "buyer",
    phone: "",
    whatsapp_number: "",
    location: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session]);

  // Filter users based on search term and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Name is required");
      setSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      setSubmitting(false);
      return;
    }

    // Check for duplicate email (only for new users)
    if (!editingUser) {
      const existingUser = users.find(
        (user) => user.email.toLowerCase() === formData.email.toLowerCase()
      );
      if (existingUser) {
        toast.error("A user with this email already exists");
        setSubmitting(false);
        return;
      }
    }

    try {
      if (editingUser) {
        // Update existing user
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update user");
        }

        toast.success("User updated successfully");
      } else {
        // Create new user
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create user");
        }

        toast.success("User created successfully");
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    const confirmMessage = `Are you sure you want to delete "${userToDelete.name}" (${userToDelete.email})? This action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast.success(`User "${userToDelete.name}" deleted successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "buyer",
      phone: user.phone || "",
      whatsapp_number: user.whatsapp_number || "",
      location: user.location || "",
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "buyer",
      phone: "",
      whatsapp_number: "",
      location: "",
    });
  };

  const getRoleBadge = (role) => {
    const variants = {
      superadmin: "danger",
      admin: "warning",
      seller: "info",
      buyer: "success",
    };
    const icons = {
      superadmin: "ti-crown",
      admin: "ti-shield",
      seller: "ti-store",
      buyer: "ti-shopping-cart",
    };
    return (
      <Badge bg={variants[role] || "secondary"}>
        <i className={`ti ${icons[role] || "ti-user"} me-1`}></i>
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <AdminGuard requiredRole="superadmin">
      <Container className="py-3">
        <Row className="mb-3 align-items-center">
          <Col>
            <div className="d-flex align-items-center gap-3">
              <div>
                <h1 className="h3 mb-1">User Management</h1>
                <p className="text-muted mb-0 small">
                  Manage all users in the system
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Badge bg="info" className="small">
                  <i className="ti ti-users me-1"></i>
                  {users.length} Users
                </Badge>
                <Badge bg="success" className="small">
                  <i className="ti ti-user-check me-1"></i>
                  {users.filter((u) => u.role !== "deleted").length} Active
                </Badge>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <Button variant="success" onClick={openCreateModal}>
              <i className="ti ti-plus me-2"></i>
              Add New User
            </Button>
          </Col>
        </Row>

        <Card>
          <Card.Body>
            {/* Search and Filter Controls */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Search Users</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Filter by Role</Form.Label>
                  <Form.Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                  }}
                >
                  <i className="ti ti-refresh me-2"></i>
                  Clear Filters
                </Button>
              </Col>
            </Row>

            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">User</th>
                    <th className="border-0">Role</th>
                    <th className="border-0">Contact</th>
                    <th className="border-0">Location</th>
                    <th className="border-0">Joined</th>
                    <th className="border-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="align-middle">
                        <td>
                          <div className="d-flex align-items-center">
                            <UserAvatar
                              user={{
                                name: user.name,
                                image: user.avatar_url,
                              }}
                              size={40}
                              className="me-3"
                            />
                            <div>
                              <div className="fw-bold">{user.name}</div>
                              <small className="text-muted">{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>
                          <div>
                            {user.whatsapp_number ? (
                              <div>
                                <i className="ti ti-brand-whatsapp me-1 text-success"></i>
                                {user.whatsapp_number}
                              </div>
                            ) : user.phone ? (
                              <div>
                                <i className="ti ti-phone me-1"></i>
                                {user.phone}
                              </div>
                            ) : (
                              <span className="text-muted">Not provided</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {user.location || (
                            <span className="text-muted">Not specified</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(user.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className="btn btn-link text-primary p-0 me-3 text-decoration-none"
                              onClick={() => openEditModal(user)}
                              title="Edit user"
                            >
                              <i className="ti ti-pencil fs-5"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-link text-danger p-0 text-decoration-none"
                              onClick={() => handleDelete(user.id)}
                              disabled={user.role === "superadmin"}
                              title="Delete user"
                            >
                              <i className="ti ti-trash fs-5"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="text-muted">
                          <i
                            className="ti ti-search"
                            style={{ fontSize: "2rem" }}
                          ></i>
                          <p className="mt-2 mb-0">
                            No users found matching your criteria
                          </p>
                          <small>
                            Try adjusting your search terms or filters
                          </small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* User Modal */}
        <Modal
          show={showModal}
          onHide={() => !submitting && setShowModal(false)}
          size="lg"
        >
          <Modal.Header closeButton={!submitting}>
            <Modal.Title>
              {editingUser ? "Edit User" : "Create New User"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="ti ti-user me-1"></i>
                      Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="ti ti-mail me-1"></i>
                      Email *
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email address"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="ti ti-shield me-1"></i>
                      Role *
                    </Form.Label>
                    <Form.Select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      required
                    >
                      <option value="buyer">
                        👤 Buyer - Can purchase products
                      </option>
                      <option value="seller">
                        🏪 Seller - Can sell products
                      </option>
                      <option value="admin">
                        🛡️ Admin - Can manage system
                      </option>
                      <option value="superadmin">
                        👑 Super Admin - Full system access
                      </option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="ti ti-phone me-1"></i>
                      Phone
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="ti ti-brand-whatsapp me-1 text-success"></i>
                      WhatsApp Number
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.whatsapp_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsapp_number: e.target.value,
                        })
                      }
                      placeholder="Enter WhatsApp number"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="ti ti-map-pin me-1"></i>
                      Location
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Enter location"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    {editingUser ? "Updating..." : "Creating..."}
                  </>
                ) : editingUser ? (
                  "Update User"
                ) : (
                  "Create User"
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </AdminGuard>
  );
}
