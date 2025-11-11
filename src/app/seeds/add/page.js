"use client";

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaSeedling, FaArrowLeft, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function AddSeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    scientific_name: '',
    variety: '',
    description: '',
    category_id: '',
    seed_type: 'seed',
    is_heirloom: false,
    is_open_pollinated: false,
    is_hybrid: false,
    quantity_available: 1,
    quantity_unit: 'packets',
    price: 0,
    is_free: true,
    is_for_exchange: true,
    growing_season: [],
    days_to_germination: '',
    days_to_harvest: '',
    difficulty_level: 'beginner',
    growing_tips: '',
    origin_location: '',
    year_collected: new Date().getFullYear(),
    source_info: '',
    images: []
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please sign in to list seeds');
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/seeds/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSeasonToggle = (season) => {
    setFormData(prev => {
      const seasons = prev.growing_season.includes(season)
        ? prev.growing_season.filter(s => s !== season)
        : [...prev.growing_season, season];
      return { ...prev, growing_season: seasons };
    });
  };

  const handleImageUrlAdd = (url) => {
    if (url && !formData.images.includes(url)) {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please enter a seed name');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/seeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          days_to_germination: formData.days_to_germination ? parseInt(formData.days_to_germination) : null,
          days_to_harvest: formData.days_to_harvest ? parseInt(formData.days_to_harvest) : null,
          year_collected: formData.year_collected ? parseInt(formData.year_collected) : null,
          is_free: formData.price === 0 || formData.is_free
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create seed listing');
      }

      const seed = await response.json();
      toast.success('Seed listed successfully! 🌱');
      router.push(`/seeds/${seed.id}`);
    } catch (error) {
      console.error('Error creating seed:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
        </div>
      </Container>
    );
  }

  if (!session) {
    return null;
  }

  const seasons = ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter'];

  return (
    <Container className="py-4">
      <Button variant="outline-secondary" size="sm" onClick={() => router.back()} className="mb-3">
        <FaArrowLeft className="me-2" />
        Back
      </Button>

      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h4 className="mb-0">
                <FaSeedling className="me-2" />
                Add Your Seeds
              </h4>
              <small>Share your seeds with the community</small>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <h5 className="fw-bold mb-3 text-success">Basic Information</h5>
                
                <Row className="mb-3">
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Seed Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., Tomato, Basil, Marigold"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        value={formData.category_id}
                        onChange={(e) => handleInputChange('category_id', e.target.value)}
                        required
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Variety</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., Cherry, Roma, Beefsteak"
                        value={formData.variety}
                        onChange={(e) => handleInputChange('variety', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Scientific Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., Solanum lycopersicum"
                        value={formData.scientific_name}
                        onChange={(e) => handleInputChange('scientific_name', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe your seeds, their characteristics, and why they're special..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </Form.Group>

                {/* Seed Details */}
                <h5 className="fw-bold mb-3 text-success">Seed Details</h5>
                
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type</Form.Label>
                      <Form.Select
                        value={formData.seed_type}
                        onChange={(e) => handleInputChange('seed_type', e.target.value)}
                      >
                        <option value="seed">Seed</option>
                        <option value="sapling">Sapling</option>
                        <option value="cutting">Cutting</option>
                        <option value="bulb">Bulb</option>
                        <option value="tuber">Tuber</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Difficulty</Form.Label>
                      <Form.Select
                        value={formData.difficulty_level}
                        onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Year Collected</Form.Label>
                      <Form.Control
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.year_collected}
                        onChange={(e) => handleInputChange('year_collected', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="mb-4">
                  <Form.Label className="d-block mb-2">Seed Characteristics</Form.Label>
                  <Form.Check
                    type="checkbox"
                    id="is_heirloom"
                    label="Heirloom Variety 🌟"
                    checked={formData.is_heirloom}
                    onChange={() => handleCheckboxChange('is_heirloom')}
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    id="is_open_pollinated"
                    label="Open Pollinated"
                    checked={formData.is_open_pollinated}
                    onChange={() => handleCheckboxChange('is_open_pollinated')}
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    id="is_hybrid"
                    label="Hybrid"
                    checked={formData.is_hybrid}
                    onChange={() => handleCheckboxChange('is_hybrid')}
                  />
                </div>

                {/* Availability */}
                <h5 className="fw-bold mb-3 text-success">Availability</h5>
                
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity Available</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.quantity_available}
                        onChange={(e) => handleInputChange('quantity_available', parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Unit</Form.Label>
                      <Form.Select
                        value={formData.quantity_unit}
                        onChange={(e) => handleInputChange('quantity_unit', e.target.value)}
                      >
                        <option value="packets">Packets</option>
                        <option value="grams">Grams</option>
                        <option value="pieces">Pieces</option>
                        <option value="saplings">Saplings</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      />
                      <Form.Text className="text-muted">Set to 0 for free</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="is_for_exchange"
                    label="Available for exchange with other seeds"
                    checked={formData.is_for_exchange}
                    onChange={() => handleCheckboxChange('is_for_exchange')}
                  />
                </div>

                {/* Growing Information */}
                <h5 className="fw-bold mb-3 text-success">Growing Information</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Best Growing Season</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {seasons.map(season => (
                      <Badge
                        key={season}
                        bg={formData.growing_season.includes(season) ? 'success' : 'secondary'}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSeasonToggle(season)}
                      >
                        {formData.growing_season.includes(season) && <FaCheck className="me-1" />}
                        {season}
                      </Badge>
                    ))}
                  </div>
                </Form.Group>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Days to Germination</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        placeholder="e.g., 7"
                        value={formData.days_to_germination}
                        onChange={(e) => handleInputChange('days_to_germination', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Days to Harvest</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        placeholder="e.g., 60"
                        value={formData.days_to_harvest}
                        onChange={(e) => handleInputChange('days_to_harvest', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Growing Tips</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Share your tips for successful growing..."
                    value={formData.growing_tips}
                    onChange={(e) => handleInputChange('growing_tips', e.target.value)}
                  />
                </Form.Group>

                {/* Origin & Source */}
                <h5 className="fw-bold mb-3 text-success">Origin & Source</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Origin Location</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Where were these seeds collected?"
                    value={formData.origin_location}
                    onChange={(e) => handleInputChange('origin_location', e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Source Information</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="e.g., Saved from my garden, From a local farmer, Family heirloom..."
                    value={formData.source_info}
                    onChange={(e) => handleInputChange('source_info', e.target.value)}
                  />
                </Form.Group>

                {/* Images */}
                <h5 className="fw-bold mb-3 text-success">Images (Optional)</h5>
                <Alert variant="info" className="mb-3">
                  <small>
                    💡 Tip: Add clear photos of your seeds, plants, or harvest to help others identify them.
                  </small>
                </Alert>
                
                {formData.images.length > 0 && (
                  <div className="mb-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between p-2 bg-light rounded mb-2">
                        <small className="text-truncate">{img}</small>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleImageRemove(idx)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Form.Group className="mb-4">
                  <Form.Label>Image URL</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="url"
                      placeholder="https://example.com/seed-image.jpg"
                      id="imageUrl"
                    />
                    <Button
                      variant="outline-success"
                      onClick={() => {
                        const input = document.getElementById('imageUrl');
                        if (input.value) {
                          handleImageUrlAdd(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </Form.Group>

                {/* Submit Buttons */}
                <div className="d-grid gap-2">
                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creating Listing...
                      </>
                    ) : (
                      <>
                        <FaSeedling className="me-2" />
                        List My Seeds
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

