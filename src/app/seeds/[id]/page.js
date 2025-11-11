"use client";

import { use, useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal, Form, Image } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaUser, FaPhone, FaSeedling, FaHeart, FaExchangeAlt, FaClock, FaCalendar, FaLeaf, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function SeedDetailPage({ params }) {
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  
  const { data: session } = useSession();
  const router = useRouter();
  const [seed, setSeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestData, setRequestData] = useState({
    request_type: 'free_claim',
    quantity_requested: 1,
    message: ''
  });

  useEffect(() => {
    fetchSeedDetails();
  }, [id]);

  const fetchSeedDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seeds/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch seed details');
      }
      
      const data = await response.json();
      setSeed(data);
    } catch (error) {
      console.error('Error fetching seed:', error);
      toast.error('Failed to load seed details');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSeed = async () => {
    if (!session) {
      toast.error('Please sign in to request seeds');
      router.push('/login');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/seeds/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          seed_id: seed.id,
          ...requestData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send request');
      }

      toast.success('Request sent successfully! The owner will be notified.');
      setShowRequestModal(false);
      setRequestData({
        request_type: 'free_claim',
        quantity_requested: 1,
        message: ''
      });
    } catch (error) {
      console.error('Error requesting seed:', error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!session) {
      toast.error('Please sign in to add to wishlist');
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/seeds/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          seed_name: seed.name,
          category_id: seed.category_id,
          variety: seed.variety,
          notes: `From ${seed.user.name}'s listing`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to wishlist');
      }

      toast.success('Added to your wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3">Loading seed details...</p>
        </div>
      </Container>
    );
  }

  if (!seed) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Seed not found</Alert>
        <Button variant="primary" onClick={() => router.push('/seeds')}>
          <FaArrowLeft className="me-2" />
          Back to Marketplace
        </Button>
      </Container>
    );
  }

  const isOwner = session?.user?.id === seed.user_id;
  const primaryImage = seed.images && seed.images.length > 0 ? seed.images[0] : '/images/placeholder-seed.jpg';

  return (
    <Container className="py-4">
      {/* Back Button */}
      <Button variant="outline-secondary" size="sm" onClick={() => router.back()} className="mb-3">
        <FaArrowLeft className="me-2" />
        Back
      </Button>

      <Row>
        {/* Left Column - Images */}
        <Col lg={5} className="mb-4">
          <Card className="shadow-sm">
            <Image
              src={primaryImage}
              alt={seed.name}
              fluid
              rounded
              style={{ width: '100%', height: '400px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = '/images/placeholder-seed.jpg';
              }}
            />
            
            {/* Thumbnail Gallery */}
            {seed.images && seed.images.length > 1 && (
              <Card.Body>
                <Row className="g-2">
                  {seed.images.slice(1, 5).map((img, idx) => (
                    <Col xs={3} key={idx}>
                      <Image
                        src={img}
                        alt={`${seed.name} ${idx + 2}`}
                        thumbnail
                        style={{ width: '100%', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            )}
          </Card>

          {/* Owner Card */}
          <Card className="shadow-sm mt-3">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <FaUser className="me-2 text-success" />
                Seed Provider
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3"
                  style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}
                >
                  {seed.user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h6 className="mb-0">{seed.user.name}</h6>
                  {seed.user.role === 'seller' && (
                    <Badge bg="success" className="mt-1">EcoExpert</Badge>
                  )}
                </div>
              </div>
              
              {seed.user.location && (
                <div className="mb-2">
                  <small className="text-muted">
                    <FaMapMarkerAlt className="me-1 text-danger" />
                    {seed.user.location}
                  </small>
                </div>
              )}

              {seed.user.phone && !isOwner && (
                <div className="mb-2">
                  <small className="text-muted">
                    <FaPhone className="me-1 text-primary" />
                    {seed.user.phone}
                  </small>
                </div>
              )}

              {!isOwner && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100 mt-2"
                  onClick={() => router.push(`/users/${seed.user_id}/listings`)}
                >
                  View All Seeds from {seed.user.name}
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Details */}
        <Col lg={7}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              {/* Title and Badges */}
              <div className="mb-3">
                <h1 className="h2 fw-bold text-dark mb-2">{seed.name}</h1>
                {seed.variety && (
                  <h5 className="text-muted mb-3">{seed.variety}</h5>
                )}
                
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {seed.is_free && (
                    <Badge bg="success" className="px-3 py-2">
                      <FaSeedling className="me-1" />
                      FREE
                    </Badge>
                  )}
                  {seed.is_heirloom && (
                    <Badge bg="warning" text="dark" className="px-3 py-2">
                      🌟 Heirloom
                    </Badge>
                  )}
                  {seed.is_open_pollinated && (
                    <Badge bg="info" className="px-3 py-2">
                      Open Pollinated
                    </Badge>
                  )}
                  {seed.is_for_exchange && (
                    <Badge bg="secondary" className="px-3 py-2">
                      <FaExchangeAlt className="me-1" />
                      Available for Exchange
                    </Badge>
                  )}
                </div>

                {seed.category && (
                  <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
                    {seed.category.icon} {seed.category.name}
                  </Badge>
                )}
              </div>

              {/* Price/Availability */}
              <div className="mb-4 p-3 bg-light rounded">
                <Row>
                  <Col xs={6}>
                    <div>
                      <small className="text-muted d-block">Price</small>
                      {seed.is_free ? (
                        <span className="text-success fw-bold fs-5">FREE</span>
                      ) : (
                        <span className="text-success fw-bold fs-5">₹{seed.price}</span>
                      )}
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div>
                      <small className="text-muted d-block">Availability</small>
                      <span className={`fw-bold ${seed.quantity_available > 0 ? 'text-success' : 'text-danger'}`}>
                        {seed.quantity_available > 0
                          ? `${seed.quantity_available} ${seed.quantity_unit}`
                          : 'Out of Stock'
                        }
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Action Buttons */}
              {!isOwner && seed.quantity_available > 0 && (
                <div className="d-flex gap-2 mb-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-grow-1"
                    onClick={() => setShowRequestModal(true)}
                  >
                    <FaSeedling className="me-2" />
                    Request This Seed
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="lg"
                    onClick={handleAddToWishlist}
                  >
                    <FaHeart />
                  </Button>
                </div>
              )}

              {isOwner && (
                <Alert variant="info">
                  <strong>This is your seed listing.</strong> You can edit it from your dashboard.
                </Alert>
              )}

              {/* Description */}
              {seed.description && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-2">About This Seed</h5>
                  <p className="text-muted">{seed.description}</p>
                </div>
              )}

              {/* Seed Information */}
              <div className="mb-4">
                <h5 className="fw-bold mb-3">Seed Information</h5>
                <Row className="g-3">
                  {seed.seed_type && (
                    <Col xs={6} md={4}>
                      <Card className="border-0 bg-light h-100">
                        <Card.Body className="text-center">
                          <FaSeedling className="text-success mb-2" size={24} />
                          <small className="text-muted d-block">Type</small>
                          <strong className="text-capitalize">{seed.seed_type}</strong>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                  {seed.difficulty_level && (
                    <Col xs={6} md={4}>
                      <Card className="border-0 bg-light h-100">
                        <Card.Body className="text-center">
                          <FaLeaf className="text-warning mb-2" size={24} />
                          <small className="text-muted d-block">Difficulty</small>
                          <strong className="text-capitalize">{seed.difficulty_level}</strong>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                  {seed.days_to_germination && (
                    <Col xs={6} md={4}>
                      <Card className="border-0 bg-light h-100">
                        <Card.Body className="text-center">
                          <FaClock className="text-info mb-2" size={24} />
                          <small className="text-muted d-block">Germination</small>
                          <strong>{seed.days_to_germination} days</strong>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                  {seed.days_to_harvest && (
                    <Col xs={6} md={4}>
                      <Card className="border-0 bg-light h-100">
                        <Card.Body className="text-center">
                          <FaCalendar className="text-primary mb-2" size={24} />
                          <small className="text-muted d-block">Harvest Time</small>
                          <strong>{seed.days_to_harvest} days</strong>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                  {seed.growing_season && seed.growing_season.length > 0 && (
                    <Col xs={12} md={8}>
                      <Card className="border-0 bg-light h-100">
                        <Card.Body>
                          <small className="text-muted d-block mb-2">Growing Season</small>
                          <div className="d-flex flex-wrap gap-2">
                            {seed.growing_season.map((season, idx) => (
                              <Badge key={idx} bg="success" pill>{season}</Badge>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                </Row>
              </div>

              {/* Growing Tips */}
              {seed.growing_tips && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-2">Growing Tips</h5>
                  <Alert variant="success" className="mb-0">
                    <FaLeaf className="me-2" />
                    {seed.growing_tips}
                  </Alert>
                </div>
              )}

              {/* Origin Information */}
              {(seed.origin_location || seed.year_collected || seed.source_info) && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-2">Origin & Source</h5>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      {seed.origin_location && (
                        <p className="mb-2">
                          <strong>Origin:</strong> {seed.origin_location}
                        </p>
                      )}
                      {seed.year_collected && (
                        <p className="mb-2">
                          <strong>Year Collected:</strong> {seed.year_collected}
                        </p>
                      )}
                      {seed.source_info && (
                        <p className="mb-0">
                          <strong>Source:</strong> {seed.source_info}
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Reviews Section */}
              {seed.reviews && seed.reviews.length > 0 && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-3">
                    Reviews ({seed.review_count})
                    {seed.average_rating && (
                      <Badge bg="warning" text="dark" className="ms-2">
                        <FaStar className="me-1" />
                        {seed.average_rating}
                      </Badge>
                    )}
                  </h5>
                  {seed.reviews.slice(0, 3).map((review) => (
                    <Card key={review.id} className="mb-2 border-0 bg-light">
                      <Card.Body>
                        <div className="d-flex justify-content-between mb-2">
                          <div>
                            <strong>{review.reviewer?.name}</strong>
                            <div>
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={i < review.rating ? 'text-warning' : 'text-muted'}
                                  size={14}
                                />
                              ))}
                            </div>
                          </div>
                          {review.germination_rate && (
                            <Badge bg="info">
                              {review.germination_rate}% germination
                            </Badge>
                          )}
                        </div>
                        {review.title && <h6>{review.title}</h6>}
                        {review.review_text && <p className="mb-0 small">{review.review_text}</p>}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Request Modal */}
      <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Request Seeds</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Request Type</Form.Label>
              <Form.Select
                value={requestData.request_type}
                onChange={(e) => setRequestData({ ...requestData, request_type: e.target.value })}
              >
                <option value="free_claim">Free Claim</option>
                <option value="exchange">Exchange for My Seeds</option>
                <option value="purchase">Purchase</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity Needed</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={seed.quantity_available}
                value={requestData.quantity_requested}
                onChange={(e) => setRequestData({ ...requestData, quantity_requested: parseInt(e.target.value) })}
              />
              <Form.Text className="text-muted">
                Available: {seed.quantity_available} {seed.quantity_unit}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message to {seed.user.name}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Introduce yourself and explain why you'd like these seeds..."
                value={requestData.message}
                onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRequestSeed}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              <>
                <FaSeedling className="me-2" />
                Send Request
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

