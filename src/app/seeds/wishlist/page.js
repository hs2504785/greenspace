"use client";

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaHeart, FaPlus, FaTrash, FaArrowLeft, FaSeedling } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function SeedWishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wishlist, setWishlist] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    seed_name: '',
    category_id: '',
    variety: '',
    notes: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please sign in to view your wishlist');
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchWishlist();
      fetchCategories();
    }
  }, [status, router]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seeds/wishlist', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch wishlist');

      const data = await response.json();
      setWishlist(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/seeds/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    
    if (!addFormData.seed_name) {
      toast.error('Please enter a seed name');
      return;
    }

    try {
      const response = await fetch('/api/seeds/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(addFormData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to wishlist');
      }

      toast.success('Added to wishlist!');
      setShowAddModal(false);
      setAddFormData({
        seed_name: '',
        category_id: '',
        variety: '',
        notes: '',
        priority: 'medium'
      });
      fetchWishlist();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error(error.message);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId) => {
    if (!confirm('Remove this seed from your wishlist?')) return;

    try {
      const response = await fetch(`/api/seeds/wishlist?id=${wishlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove from wishlist');
      }

      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error(error.message);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3">Loading your wishlist...</p>
        </div>
      </Container>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="outline-secondary" size="sm" onClick={() => router.back()} className="mb-2">
            <FaArrowLeft className="me-2" />
            Back
          </Button>
          <h2 className="mb-1">
            <FaHeart className="text-danger me-2" />
            My Seed Wishlist
          </h2>
          <p className="text-muted mb-0">Seeds you'd like to grow</p>
        </div>
        <Button variant="success" onClick={() => setShowAddModal(true)}>
          <FaPlus className="me-2" />
          Add to Wishlist
        </Button>
      </div>

      {/* Wishlist Items */}
      {wishlist.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaHeart className="text-muted mb-3" size={64} />
            <h5 className="text-muted mb-3">Your wishlist is empty</h5>
            <p className="text-muted mb-4">
              Add seeds you'd like to grow and we'll help you find them in the community
            </p>
            <Button variant="success" onClick={() => setShowAddModal(true)}>
              <FaPlus className="me-2" />
              Add Your First Seed
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {wishlist.map((item) => (
            <Col key={item.id} xs={12}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Row>
                    <Col md={8}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1">
                            {item.seed_name}
                            {item.variety && (
                              <small className="text-muted ms-2">• {item.variety}</small>
                            )}
                          </h5>
                          <div className="mb-2">
                            {item.category && (
                              <Badge bg="light" text="dark" className="me-2">
                                {item.category.icon} {item.category.name}
                              </Badge>
                            )}
                            <Badge 
                              bg={
                                item.priority === 'high' ? 'danger' :
                                item.priority === 'medium' ? 'warning' : 'secondary'
                              }
                            >
                              {item.priority} priority
                            </Badge>
                            {item.is_fulfilled && (
                              <Badge bg="success" className="ms-2">
                                ✓ Fulfilled
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveFromWishlist(item.id)}
                        >
                          <FaTrash />
                        </Button>
                      </div>

                      {item.notes && (
                        <p className="text-muted small mb-2">{item.notes}</p>
                      )}

                      <small className="text-muted">
                        Added {new Date(item.created_at).toLocaleDateString()}
                      </small>
                    </Col>

                    <Col md={4}>
                      {/* Matching Seeds */}
                      {item.matching_seeds && item.matching_seeds.length > 0 ? (
                        <div>
                          <small className="text-success fw-bold d-block mb-2">
                            <FaSeedling className="me-1" />
                            {item.matching_seeds.length} Match{item.matching_seeds.length !== 1 ? 'es' : ''} Found!
                          </small>
                          <div className="d-flex flex-column gap-2">
                            {item.matching_seeds.slice(0, 2).map((seed) => (
                              <Card key={seed.id} className="border">
                                <Card.Body className="p-2">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <small className="fw-bold d-block">{seed.name}</small>
                                      <small className="text-muted">
                                        {seed.is_free ? (
                                          <Badge bg="success" className="me-1">FREE</Badge>
                                        ) : (
                                          <span className="text-success">₹{seed.price}</span>
                                        )}
                                        • {seed.user?.name}
                                      </small>
                                    </div>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => router.push(`/seeds/${seed.id}`)}
                                    >
                                      View
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            ))}
                            {item.matching_seeds.length > 2 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-start"
                                onClick={() => router.push(`/seeds?search=${encodeURIComponent(item.seed_name)}`)}
                              >
                                View all {item.matching_seeds.length} matches
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Alert variant="light" className="mb-0 small">
                          <small className="text-muted">
                            No matches yet. We'll notify you when someone lists this seed!
                          </small>
                        </Alert>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add to Wishlist Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHeart className="text-danger me-2" />
            Add to Wishlist
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddToWishlist}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Seed Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Tomato, Basil, Marigold"
                value={addFormData.seed_name}
                onChange={(e) => setAddFormData({ ...addFormData, seed_name: e.target.value })}
                required
              />
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={addFormData.category_id}
                    onChange={(e) => setAddFormData({ ...addFormData, category_id: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={addFormData.priority}
                    onChange={(e) => setAddFormData({ ...addFormData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Variety (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Cherry, Roma"
                value={addFormData.variety}
                onChange={(e) => setAddFormData({ ...addFormData, variety: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Why do you want this seed? Any specific requirements..."
                value={addFormData.notes}
                onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              <FaHeart className="me-2" />
              Add to Wishlist
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

