'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Badge, Button, Card, Form } from 'react-bootstrap';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export default function VegetableDetails({ vegetable }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!vegetable) {
    router.push('/');
    return null;
  }

  const handleWhatsAppClick = () => {
    const message = `Hi, I'm interested in buying ${vegetable.name}`;
    const whatsappUrl = `https://wa.me/${vegetable.owner?.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddToCart = () => {
    console.log('Adding to cart - Vegetable:', vegetable);
    console.log('Owner details:', vegetable.owner);
    console.log('WhatsApp number:', vegetable.owner?.whatsapp);
    const result = addToCart(vegetable, quantity);
    if (!result.success) {
      toast.error(result.error, {
        duration: 5000, // Show error for longer
      });
    } else {
      toast.success(`Added ${quantity}kg of ${vegetable.name} to cart`, {
        icon: '🛒',
      });
    }
  };

  // Rest of the component remains the same
  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col lg={6}>
          <div className="position-relative rounded-4 overflow-hidden shadow-sm" style={{ height: '500px' }}>
            {vegetable.images && vegetable.images.length > 0 && vegetable.images[0] ? (
              <Image
                src={vegetable.images[0]}
                alt={vegetable.name}
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-4"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 bg-light rounded-4">
                <div className="text-center text-muted">
                  <i className="ti-image display-1"></i>
                  <p className="mt-2">No image available</p>
                </div>
              </div>
            )}
          </div>
        </Col>

        <Col lg={6}>
          <div className="sticky-lg-top" style={{ top: '2rem' }}>
            {/* Title and Price */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h1 className="mb-0 fw-bold">{vegetable.name}</h1>
              <Badge bg="success" className="fs-5 px-3 py-2">₹{vegetable.price}/kg</Badge>
            </div>

            {/* Description */}
            <p className="text-muted lead mb-4">{vegetable.description}</p>

            {/* Quick Info Cards */}
            <Row className="g-3 mb-4">
              <Col sm={6}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body className="d-flex align-items-center">
                    <i className="ti-location-pin fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Location</div>
                      <div className="fw-semibold">{vegetable.location}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body className="d-flex align-items-center">
                    <i className="ti-package fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Available Quantity</div>
                      <div className="fw-semibold">{vegetable.quantity} kg</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body className="d-flex align-items-center">
                    <i className="ti-tag fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Category</div>
                      <div className="fw-semibold text-capitalize">{vegetable.category}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body className="d-flex align-items-center">
                    <i className="ti-home fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Source</div>
                      <div className="fw-semibold">{vegetable.sourceType === 'farm' ? 'Farm' : 'Home Garden'}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Seller Information */}
            <Card className="border-0 bg-light mb-4">
              <Card.Body>
                <h5 className="mb-4">Seller Information</h5>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="bg-white rounded-circle p-3 me-3 shadow-sm">
                      <i className="ti-user fs-4 text-success"></i>
                    </div>
                    <div>
                      <div className="fw-semibold">{vegetable.owner?.name || 'Anonymous Seller'}</div>
                      <div className="text-muted small">
                        <i className="ti-check-box text-success me-1"></i>
                        Verified Seller
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="success" 
                    size="lg"
                    onClick={handleWhatsAppClick}
                    className="px-4"
                  >
                    <i className="ti-comment me-2"></i>
                    Contact Seller
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Add to Cart Section */}
            <Card className="border-0 bg-light mb-4">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <Form.Control
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={vegetable.quantity}
                    style={{ width: '100px' }}
                    className="me-3"
                  />
                  <div className="text-muted">kg</div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="text-muted">Subtotal</div>
                  <div className="fs-4 fw-bold">₹{vegetable.price * quantity}</div>
                </div>
                <div className="d-grid">
                  <Button 
                    variant="success" 
                    size="lg"
                    onClick={handleAddToCart}
                  >
                    <i className="ti-shopping-cart me-2"></i>
                    Add to Cart
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}