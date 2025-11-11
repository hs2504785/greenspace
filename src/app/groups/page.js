"use client";

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { FaUsers, FaMapMarkerAlt, FaCalendar, FaComments, FaArrowRight } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMembers: 0,
    totalEvents: 0,
    totalPosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentGroups, setRecentGroups] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/groups');
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const data = await response.json();
      
      const totalMembers = data.reduce((sum, group) => sum + (group.member_count || 0), 0);
      const totalEvents = data.reduce((sum, group) => sum + (group.event_count || 0), 0);
      const totalPosts = data.reduce((sum, group) => sum + (group.post_count || 0), 0);
      
      setStats({
        totalGroups: data.length,
        totalMembers,
        totalEvents,
        totalPosts
      });
      
      // Get top 3 most active groups
      const sorted = [...data]
        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        .slice(0, 3);
      setRecentGroups(sorted);
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load group statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="mb-3">
          <FaUsers size={48} className="text-success" />
        </div>
        <h1 
          className="mb-3 cursor-pointer" 
          onClick={() => router.push('/groups/manage')}
          style={{ cursor: 'pointer' }}
        >
          Local Farming Groups <FaArrowRight className="ms-2" size={20} />
        </h1>
        <p className="lead text-muted mb-0">
          Connect with natural farming enthusiasts in your area. Share knowledge, seeds, and experiences.
        </p>
      </div>

      {/* Stats Tiles - Clickable */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3">Loading statistics...</p>
        </div>
      ) : (
        <Row className="mb-4">
          <Col md={3}>
            <Card 
              className="border-0 shadow-sm text-center hover-shadow transition cursor-pointer"
              onClick={() => router.push('/groups/manage')}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body>
                <FaUsers size={32} className="text-primary mb-2" />
                <h3 className="mb-0">{stats.totalGroups}</h3>
                <small className="text-muted">Active Groups</small>
                <div className="mt-2">
                  <small className="text-primary">
                    View All <FaArrowRight className="ms-1" size={12} />
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card 
              className="border-0 shadow-sm text-center hover-shadow transition cursor-pointer"
              onClick={() => router.push('/groups/manage')}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body>
                <FaUsers size={32} className="text-success mb-2" />
                <h3 className="mb-0">{stats.totalMembers}</h3>
                <small className="text-muted">Total Members</small>
                <div className="mt-2">
                  <small className="text-success">
                    Browse Groups <FaArrowRight className="ms-1" size={12} />
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card 
              className="border-0 shadow-sm text-center hover-shadow transition cursor-pointer"
              onClick={() => router.push('/groups/manage')}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body>
                <FaCalendar size={32} className="text-warning mb-2" />
                <h3 className="mb-0">{stats.totalEvents}</h3>
                <small className="text-muted">Upcoming Events</small>
                <div className="mt-2">
                  <small className="text-warning">
                    View Events <FaArrowRight className="ms-1" size={12} />
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card 
              className="border-0 shadow-sm text-center hover-shadow transition cursor-pointer"
              onClick={() => router.push('/groups/manage')}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body>
                <FaComments size={32} className="text-info mb-2" />
                <h3 className="mb-0">{stats.totalPosts}</h3>
                <small className="text-muted">Discussions</small>
                <div className="mt-2">
                  <small className="text-info">
                    Join Discussions <FaArrowRight className="ms-1" size={12} />
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Most Active Groups */}
      {!loading && recentGroups.length > 0 && (
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Most Active Groups</h5>
              <Button
                variant="link"
                onClick={() => router.push('/groups/manage')}
                className="text-decoration-none"
              >
                View All <FaArrowRight className="ms-1" />
              </Button>
            </div>
            <Row className="g-3">
              {recentGroups.map(group => (
                <Col key={group.id} xs={12} md={4}>
                  <Card className="h-100 hover-shadow transition" style={{ cursor: 'pointer' }}>
                    <Card.Body onClick={() => router.push(`/groups/${group.slug}`)}>
                      <div className="d-flex align-items-start mb-2">
                        {group.cover_image ? (
                          <img
                            src={group.cover_image}
                            alt={group.name}
                            className="rounded me-3"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="rounded bg-light d-flex align-items-center justify-content-center me-3"
                            style={{ width: '50px', height: '50px' }}
                          >
                            <FaUsers className="text-muted" />
                          </div>
                        )}
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{group.name}</h6>
                          <small className="text-muted">
                            <FaMapMarkerAlt className="me-1 text-danger" />
                            {group.location}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="text-center flex-fill">
                          <div className="fw-bold text-success">{group.member_count || 0}</div>
                          <small className="text-muted">Members</small>
                        </div>
                        <div className="text-center flex-fill">
                          <div className="fw-bold text-info">{group.post_count || 0}</div>
                          <small className="text-muted">Posts</small>
                        </div>
                        <div className="text-center flex-fill">
                          <div className="fw-bold text-warning">{group.event_count || 0}</div>
                          <small className="text-muted">Events</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Info Section */}
      <Card className="mt-5 bg-light border-0">
        <Card.Body className="py-4">
          <Row>
            <Col md={4} className="text-center mb-3 mb-md-0">
              <FaUsers className="text-success mb-2" size={32} />
              <h6 className="fw-bold">Connect Locally</h6>
              <small className="text-muted">
                Meet farmers and enthusiasts in your area
              </small>
            </Col>
            <Col md={4} className="text-center mb-3 mb-md-0">
              <FaComments className="text-primary mb-2" size={32} />
              <h6 className="fw-bold">Share Knowledge</h6>
              <small className="text-muted">
                Exchange tips, experiences, and best practices
              </small>
            </Col>
            <Col md={4} className="text-center">
              <FaCalendar className="text-warning mb-2" size={32} />
              <h6 className="fw-bold">Organize Events</h6>
              <small className="text-muted">
                Host meetups, workshops, and farm visits
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

