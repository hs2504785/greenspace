"use client";

import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function GroupForm({ show, onHide, onSuccess, group = null }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    state: '',
    privacy: 'public',
    group_type: 'location-based',
    auto_approve_members: true,
    allow_member_posts: true,
    allow_events: true,
    max_members: 0
  });

  useEffect(() => {
    if (group) {
      // Edit mode - populate with group data
      setFormData({
        name: group.name || '',
        description: group.description || '',
        location: group.location || '',
        state: group.state || '',
        privacy: group.privacy || 'public',
        group_type: group.group_type || 'location-based',
        auto_approve_members: group.auto_approve_members !== undefined ? group.auto_approve_members : true,
        allow_member_posts: group.allow_member_posts !== undefined ? group.allow_member_posts : true,
        allow_events: group.allow_events !== undefined ? group.allow_events : true,
        max_members: group.max_members || 0
      });
    } else {
      // Add mode - reset form
      setFormData({
        name: '',
        description: '',
        location: '',
        state: '',
        privacy: 'public',
        group_type: 'location-based',
        auto_approve_members: true,
        allow_member_posts: true,
        allow_events: true,
        max_members: 0
      });
    }
  }, [group, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const url = group ? `/api/groups/${group.id}` : '/api/groups';
      const method = group ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${group ? 'update' : 'create'} group`);
      }

      toast.success(`Group ${group ? 'updated' : 'created'} successfully!`);
      onSuccess(data);
      onHide();

    } catch (error) {
      console.error('Error saving group:', error);
      toast.error(error.message || `Failed to ${group ? 'update' : 'create'} group`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {group ? 'Edit Group' : 'Add New Group'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            {/* Group Name */}
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Group Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Hyderabad Natural Farmers"
                  required
                />
              </Form.Group>
            </Col>

            {/* Privacy */}
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Privacy</Form.Label>
                <Form.Select
                  name="privacy"
                  value={formData.privacy}
                  onChange={handleChange}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Description */}
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Tell members what this group is about..."
            />
          </Form.Group>

          <Row>
            {/* Location */}
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Location <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, District, or Region"
                  required
                />
              </Form.Group>
            </Col>

            {/* State */}
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            {/* Group Type */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Group Type</Form.Label>
                <Form.Select
                  name="group_type"
                  value={formData.group_type}
                  onChange={handleChange}
                >
                  <option value="location-based">Location-based</option>
                  <option value="interest-based">Interest-based</option>
                  <option value="practice-based">Practice-based</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Max Members */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Max Members (0 = unlimited)</Form.Label>
                <Form.Control
                  type="number"
                  name="max_members"
                  value={formData.max_members}
                  onChange={handleChange}
                  min="0"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Member Permissions */}
          <div className="border-top pt-3 mt-2">
            <h6 className="mb-3">Member Permissions</h6>

            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                name="auto_approve_members"
                checked={formData.auto_approve_members}
                onChange={handleChange}
                label="Automatically approve new members"
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                name="allow_member_posts"
                checked={formData.allow_member_posts}
                onChange={handleChange}
                label="Allow all members to create posts"
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Check
                type="checkbox"
                name="allow_events"
                checked={formData.allow_events}
                onChange={handleChange}
                label="Allow members to create events"
              />
            </Form.Group>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2"
                />
                {group ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              group ? 'Update Group' : 'Add Group'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

