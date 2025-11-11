"use client";

import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const SEED_TYPES = ['seed', 'sapling', 'cutting', 'bulb', 'tuber'];
const QUANTITY_UNITS = ['packets', 'grams', 'pieces', 'plants'];
const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];
const SEASONS = ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter'];

export default function SeedForm({
  show,
  onHide,
  onSuccess,
  seed = null,
  categories = []
}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    scientific_name: '',
    variety: '',
    description: '',
    category_id: categories[0]?.id || '',
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
    if (seed) {
      // Edit mode - populate with seed data, ensuring no null values
      setFormData({
        name: seed.name || '',
        scientific_name: seed.scientific_name || '',
        variety: seed.variety || '',
        description: seed.description || '',
        category_id: seed.category_id || seed.category?.id || categories[0]?.id || '',
        seed_type: seed.seed_type || 'seed',
        is_heirloom: seed.is_heirloom || false,
        is_open_pollinated: seed.is_open_pollinated || false,
        is_hybrid: seed.is_hybrid || false,
        quantity_available: seed.quantity_available || 1,
        quantity_unit: seed.quantity_unit || 'packets',
        price: seed.price || 0,
        is_free: seed.is_free !== undefined ? seed.is_free : true,
        is_for_exchange: seed.is_for_exchange !== undefined ? seed.is_for_exchange : true,
        growing_season: seed.growing_season || [],
        days_to_germination: seed.days_to_germination || '',
        days_to_harvest: seed.days_to_harvest || '',
        difficulty_level: seed.difficulty_level || 'beginner',
        growing_tips: seed.growing_tips || '',
        origin_location: seed.origin_location || '',
        year_collected: seed.year_collected || new Date().getFullYear(),
        source_info: seed.source_info || '',
        images: seed.images || []
      });
    } else {
      // Add mode - reset form
      setFormData({
        name: '',
        scientific_name: '',
        variety: '',
        description: '',
        category_id: categories[0]?.id || '',
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
    }
  }, [seed, categories]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSeasonToggle = (season) => {
    setFormData(prev => ({
      ...prev,
      growing_season: prev.growing_season.includes(season)
        ? prev.growing_season.filter(s => s !== season)
        : [...prev.growing_season, season]
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
      
      const url = seed ? `/api/seeds/${seed.id}` : '/api/seeds';
      const method = seed ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
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
        throw new Error(error.error || `Failed to ${seed ? 'update' : 'create'} seed listing`);
      }

      toast.success(`Seed ${seed ? 'updated' : 'added'} successfully!`);
      onSuccess();
      onHide();
    } catch (error) {
      console.error('Error saving seed:', error);
      toast.error(error.message || `Failed to ${seed ? 'update' : 'add'} seed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`ti ${seed ? 'ti-pencil' : 'ti-plus'} me-2`}></i>
          {seed ? 'Edit Seed' : 'Add Your Seeds'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Basic Information */}
          <h5 className="fw-bold mb-3 text-success">Basic Information</h5>
          
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Seed Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Tomato, Basil, Marigold"
                  value={formData.name || ''}
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
                  placeholder="e.g., Cherry, Heirloom, Hybrid"
                  value={formData.variety || ''}
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
                  value={formData.scientific_name || ''}
                  onChange={(e) => handleInputChange('scientific_name', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe your seeds, their characteristics, and any special notes..."
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Form.Group>

          {/* Seed Type & Characteristics */}
          <h5 className="fw-bold mb-3 text-success mt-4">Seed Type & Characteristics</h5>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={formData.seed_type}
                  onChange={(e) => handleInputChange('seed_type', e.target.value)}
                >
                  {SEED_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Special Traits</Form.Label>
                <div>
                  <Form.Check
                    type="checkbox"
                    label="Heirloom"
                    checked={formData.is_heirloom}
                    onChange={(e) => handleInputChange('is_heirloom', e.target.checked)}
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    label="Open Pollinated"
                    checked={formData.is_open_pollinated}
                    onChange={(e) => handleInputChange('is_open_pollinated', e.target.checked)}
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    label="Hybrid"
                    checked={formData.is_hybrid}
                    onChange={(e) => handleInputChange('is_hybrid', e.target.checked)}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Availability */}
          <h5 className="fw-bold mb-3 text-success mt-4">Availability</h5>
          
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Quantity Available *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.quantity_available}
                  onChange={(e) => handleInputChange('quantity_available', parseInt(e.target.value))}
                  required
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
                  {QUANTITY_UNITS.map(unit => (
                    <option key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </option>
                  ))}
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
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  disabled={formData.is_free}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Check
                type="checkbox"
                label="Free (No charge)"
                checked={formData.is_free}
                onChange={(e) => {
                  handleInputChange('is_free', e.target.checked);
                  if (e.target.checked) handleInputChange('price', 0);
                }}
              />
            </Col>
            <Col md={6}>
              <Form.Check
                type="checkbox"
                label="Available for Exchange"
                checked={formData.is_for_exchange}
                onChange={(e) => handleInputChange('is_for_exchange', e.target.checked)}
              />
            </Col>
          </Row>

          {/* Growing Information */}
          <h5 className="fw-bold mb-3 text-success mt-4">Growing Information</h5>
          
          <Form.Group className="mb-3">
            <Form.Label>Growing Season</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {SEASONS.map(season => (
                <Badge
                  key={season}
                  bg={formData.growing_season.includes(season) ? 'success' : 'secondary'}
                  role="button"
                  onClick={() => handleSeasonToggle(season)}
                  style={{ cursor: 'pointer' }}
                >
                  {season}
                </Badge>
              ))}
            </div>
          </Form.Group>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Days to Germination</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="e.g., 7"
                  value={formData.days_to_germination || ''}
                  onChange={(e) => handleInputChange('days_to_germination', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Days to Harvest</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="e.g., 60"
                  value={formData.days_to_harvest || ''}
                  onChange={(e) => handleInputChange('days_to_harvest', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Difficulty Level</Form.Label>
                <Form.Select
                  value={formData.difficulty_level}
                  onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Growing Tips</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Share any tips for successfully growing these seeds..."
              value={formData.growing_tips || ''}
              onChange={(e) => handleInputChange('growing_tips', e.target.value)}
            />
          </Form.Group>

          {/* Origin & Source */}
          <h5 className="fw-bold mb-3 text-success mt-4">Origin & Source</h5>
          
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Origin Location</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Where were these seeds collected?"
                  value={formData.origin_location || ''}
                  onChange={(e) => handleInputChange('origin_location', e.target.value)}
                />
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

          <Form.Group className="mb-3">
            <Form.Label>Source Information</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="e.g., Saved from my garden, From a local farmer, Family heirloom..."
              value={formData.source_info || ''}
              onChange={(e) => handleInputChange('source_info', e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            <>
              <i className={`ti ${seed ? 'ti-refresh' : 'ti-plus'} me-2`}></i>
              {seed ? 'Update Seed' : 'Add Seed'}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

