"use client";

import { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function CreateGroupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="text-muted mt-3">Loading...</p>
      </Container>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

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

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      toast.success('Group created successfully!');
      router.push(`/groups/${data.slug}`);

    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="mb-4">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => router.back()}
          className="mb-3"
        >
          <FaArrowLeft className="me-2" />
          Back
        </Button>
        <h2 className="mb-1">
          <FaUsers className="text-success me-2" />
          Create New Group
        </h2>
        <p className="text-muted mb-0">
          Start a local farming community in your area
        </p>
      </div>

      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <h5 className="mb-3">Basic Information</h5>
            
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
              <Form.Text className="text-muted">
                Choose a clear, descriptive name for your group
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Tell members what this group is about..."
              />
            </Form.Group>

            <Row>
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

            {/* Group Settings */}
            <h5 className="mb-3 mt-4">Group Settings</h5>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Privacy</Form.Label>
                  <Form.Select
                    name="privacy"
                    value={formData.privacy}
                    onChange={handleChange}
                  >
                    <option value="public">Public - Anyone can join</option>
                    <option value="private">Private - Requires approval</option>
                  </Form.Select>
                </Form.Group>
              </Col>
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
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Maximum Members (0 for unlimited)</Form.Label>
              <Form.Control
                type="number"
                name="max_members"
                value={formData.max_members}
                onChange={handleChange}
                min="0"
              />
            </Form.Group>

            {/* Member Permissions */}
            <h5 className="mb-3 mt-4">Member Permissions</h5>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="auto_approve_members"
                checked={formData.auto_approve_members}
                onChange={handleChange}
                label="Automatically approve new members"
              />
              <Form.Text className="text-muted d-block">
                If unchecked, you'll need to manually approve join requests
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="allow_member_posts"
                checked={formData.allow_member_posts}
                onChange={handleChange}
                label="Allow all members to create posts"
              />
              <Form.Text className="text-muted d-block">
                If unchecked, only admins and moderators can post
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                name="allow_events"
                checked={formData.allow_events}
                onChange={handleChange}
                label="Allow members to create events"
              />
            </Form.Group>

            {/* Submit */}
            <div className="d-flex gap-2">
              <Button
                variant="success"
                type="submit"
                disabled={loading}
                className="px-4"
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaUsers className="me-2" />
                    Create Group
                  </>
                )}
              </Button>
              <Button
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
    </Container>
  );
}

