"use client";

import { use, useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Tab, Tabs, ListGroup } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaMapMarkerAlt, FaCalendar, FaComments, FaSignOutAlt, FaCog } from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GroupDetailPage({ params }) {
  const { slug } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    fetchGroupData();
  }, [slug]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      
      // Fetch group by slug
      const groupsResponse = await fetch(`/api/groups?search=${slug}`);
      if (!groupsResponse.ok) throw new Error('Failed to fetch group');
      
      const groupsData = await groupsResponse.json();
      const foundGroup = groupsData.find(g => g.slug === slug);
      
      if (!foundGroup) {
        toast.error('Group not found');
        router.push('/groups');
        return;
      }

      setGroup(foundGroup);

      // Fetch members
      const membersResponse = await fetch(`/api/groups/${foundGroup.id}/members`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }

      // Fetch posts
      const postsResponse = await fetch(`/api/groups/${foundGroup.id}/posts`);
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData);
      }

      // Fetch events
      const eventsResponse = await fetch(`/api/groups/${foundGroup.id}/events`);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }

    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!session) {
      toast.error('Please sign in to join groups');
      router.push('/login');
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`/api/groups/${group.id}/join`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      toast.success(data.message || 'Successfully joined the group!');
      fetchGroupData(); // Refresh data

    } catch (error) {
      console.error('Error joining group:', error);
      toast.error(error.message || 'Failed to join group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`/api/groups/${group.id}/leave`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave group');
      }

      toast.success('Successfully left the group');
      router.push('/groups');

    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error(error.message || 'Failed to leave group');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="text-muted mt-3">Loading group...</p>
      </Container>
    );
  }

  if (!group) {
    return null;
  }

  const userMembership = members.find(m => m.user_id === session?.user?.id && m.status === 'active');
  const isMember = !!userMembership;
  const isAdmin = userMembership?.role === 'admin';
  const isModerator = userMembership?.role === 'moderator';

  return (
    <Container className="py-4">
      {/* Group Header */}
      <Card className="shadow-sm mb-4">
        {group.cover_image && (
          <Card.Img
            variant="top"
            src={group.cover_image}
            style={{ height: '200px', objectFit: 'cover' }}
          />
        )}
        <Card.Body>
          <Row>
            <Col md={8}>
              <div className="d-flex align-items-start mb-3">
                <div className="flex-grow-1">
                  <h2 className="mb-2">{group.name}</h2>
                  <div className="mb-2">
                    <Badge bg={group.privacy === 'public' ? 'success' : 'secondary'} className="me-2">
                      {group.privacy === 'public' ? 'Public' : 'Private'} Group
                    </Badge>
                    <Badge bg="light" text="dark">
                      {group.group_type.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-muted mb-2">
                    <FaMapMarkerAlt className="me-1 text-danger" />
                    {group.location}{group.state && `, ${group.state}`}
                  </p>
                </div>
              </div>
              
              <p className="text-muted mb-3">{group.description}</p>

              <div className="d-flex gap-4 mb-3">
                <div>
                  <FaUsers className="me-2 text-success" />
                  <strong>{group.member_count || 0}</strong> members
                </div>
                <div>
                  <FaComments className="me-2 text-info" />
                  <strong>{group.post_count || 0}</strong> posts
                </div>
                <div>
                  <FaCalendar className="me-2 text-warning" />
                  <strong>{group.event_count || 0}</strong> events
                </div>
              </div>
            </Col>

            <Col md={4} className="text-md-end">
              {session ? (
                isMember ? (
                  <div className="d-grid gap-2">
                    {(isAdmin || isModerator) && (
                      <Button
                        variant="outline-primary"
                        onClick={() => router.push(`/groups/${slug}/settings`)}
                      >
                        <FaCog className="me-2" />
                        Group Settings
                      </Button>
                    )}
                    <Button
                      variant="outline-danger"
                      onClick={handleLeaveGroup}
                      disabled={actionLoading}
                    >
                      <FaSignOutAlt className="me-2" />
                      Leave Group
                    </Button>
                    <Badge bg="success" className="p-2">
                      <i className="ti ti-check me-1"></i>
                      You're a {userMembership.role}
                    </Badge>
                  </div>
                ) : (
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleJoinGroup}
                    disabled={actionLoading}
                    className="w-100"
                  >
                    {actionLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Joining...
                      </>
                    ) : (
                      <>
                        <FaUsers className="me-2" />
                        Join Group
                      </>
                    )}
                  </Button>
                )
              ) : (
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => router.push('/login')}
                  className="w-100"
                >
                  Sign In to Join
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="about" title="About">
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">About This Group</h5>
              <p>{group.description || 'No description available.'}</p>
              
              <h6 className="mt-4 mb-3">Group Details</h6>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Location:</strong> {group.location}
                  {group.state && `, ${group.state}`}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Privacy:</strong> {group.privacy === 'public' ? 'Public' : 'Private'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Type:</strong> {group.group_type.replace('-', ' ')}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Created:</strong> {new Date(group.created_at).toLocaleDateString()}
                </ListGroup.Item>
                {group.max_members > 0 && (
                  <ListGroup.Item>
                    <strong>Max Members:</strong> {group.max_members}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="members" title={`Members (${members.length})`}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Group Members</h5>
              {members.length > 0 ? (
                <Row className="g-3">
                  {members.map(member => (
                    <Col key={member.id} xs={12} sm={6} md={4} lg={3}>
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          {member.user?.avatar_url ? (
                            <img
                              src={member.user.avatar_url}
                              alt={member.user.name}
                              className="rounded-circle mb-2"
                              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2"
                              style={{ width: '60px', height: '60px' }}
                            >
                              <FaUsers size={24} className="text-muted" />
                            </div>
                          )}
                          <h6 className="mb-1">{member.user?.name || 'Unknown'}</h6>
                          <Badge bg={member.role === 'admin' ? 'danger' : member.role === 'moderator' ? 'warning' : 'secondary'}>
                            {member.role}
                          </Badge>
                          {member.user?.location && (
                            <p className="text-muted small mt-2 mb-0">
                              <FaMapMarkerAlt className="me-1" />
                              {member.user.location}
                            </p>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <p className="text-muted text-center">No members yet.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="posts" title={`Discussions (${posts.length})`}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Recent Discussions</h5>
                {isMember && (
                  <Button variant="success" size="sm">
                    <FaComments className="me-2" />
                    New Post
                  </Button>
                )}
              </div>
              
              {posts.length > 0 ? (
                <ListGroup variant="flush">
                  {posts.map(post => (
                    <ListGroup.Item key={post.id} className="px-0">
                      <div className="d-flex">
                        {post.user?.avatar_url ? (
                          <img
                            src={post.user.avatar_url}
                            alt={post.user.name}
                            className="rounded-circle me-3"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                            style={{ width: '40px', height: '40px' }}
                          >
                            <FaUsers size={20} className="text-muted" />
                          </div>
                        )}
                        <div className="flex-grow-1">
                          {post.title && <h6 className="mb-1">{post.title}</h6>}
                          <p className="mb-1">{post.content.substring(0, 150)}...</p>
                          <small className="text-muted">
                            by {post.user?.name || 'Unknown'} • {new Date(post.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted text-center">No discussions yet. Be the first to start a conversation!</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="events" title={`Events (${events.length})`}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Upcoming Events</h5>
                {isMember && (
                  <Button variant="success" size="sm">
                    <FaCalendar className="me-2" />
                    Create Event
                  </Button>
                )}
              </div>

              {events.length > 0 ? (
                <Row className="g-3">
                  {events.map(event => (
                    <Col key={event.id} xs={12} md={6}>
                      <Card>
                        <Card.Body>
                          <Badge bg="warning" text="dark" className="mb-2">
                            {event.event_type}
                          </Badge>
                          <h6 className="mb-2">{event.title}</h6>
                          <p className="text-muted small mb-2">
                            {event.description?.substring(0, 100)}...
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              <FaCalendar className="me-1" />
                              {new Date(event.start_date).toLocaleDateString()}
                            </small>
                            <small className="text-muted">
                              <FaUsers className="me-1" />
                              {event.attendee_count || 0} going
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <p className="text-muted text-center">No upcoming events. Check back later!</p>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

