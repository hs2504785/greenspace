"use client";

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Table, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { FaUsers, FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SearchInput from '@/components/common/SearchInput';
import GroupForm from '@/components/features/groups/GroupForm';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';

export default function ManageGroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please sign in to manage groups');
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchGroups();
    }
  }, [status]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Fetch all groups
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data || []);
      setAllGroups(data || []);
      
      // Extract unique locations
      const uniqueLocations = [...new Set(data.map(g => g.location))].sort();
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = allGroups;
    
    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (locationFilter && locationFilter !== 'all') {
      filtered = filtered.filter(g => g.location === locationFilter);
    }
    
    setGroups(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setLocationFilter('all');
    setGroups(allGroups);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, locationFilter]);

  const handleAdd = () => {
    setSelectedGroup(null);
    setShowForm(true);
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedGroup(null);
  };

  const handleDelete = (group) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGroup) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      toast.success('Group deleted successfully');
      setShowDeleteModal(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="text-muted mt-3">Loading...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FaUsers className="text-success me-2" />
            Manage Groups
          </h2>
          <p className="text-muted mb-0">
            View and manage your farming groups
          </p>
        </div>
        <Button
          variant="success"
          size="lg"
          onClick={handleAdd}
        >
          <FaPlus className="me-2" />
          Create New Group
        </Button>
      </div>

      {/* Filters - Same style as seeds */}
      <Row className="mb-4">
        <Col md={6}>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search groups by name or location..."
          />
        </Col>
        <Col md={4}>
          <Form.Select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </Col>
      </Row>

      {/* Groups Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3">Loading groups...</p>
        </div>
      ) : groups.length > 0 ? (
        <div className="table-responsive">
          <Table
            hover
            className="mb-0 bg-white rounded-3 shadow-sm overflow-hidden"
          >
            <thead className="table-light">
              <tr>
                <th className="border-0 ps-3">Group</th>
                <th className="border-0">Location</th>
                <th className="border-0">Members</th>
                <th className="border-0">Category</th>
                <th className="border-0">Status</th>
                <th className="border-0">Created</th>
                <th className="border-0 text-center" style={{ width: "120px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => {
                const isOwner = group.created_by === session?.user?.id;
                
                return (
                  <tr key={group.id} className="align-middle">
                    <td className="ps-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-light rounded me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 40, height: 40 }}
                        >
                          <FaUsers className="text-muted" />
                        </div>
                        <div className="min-w-0">
                          <div className="fw-bold text-truncate">
                            {group.name}
                          </div>
                          {group.location && (
                            <small className="text-muted d-block text-truncate">
                              <FaMapMarkerAlt className="me-1" size={10} />
                              {group.location}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {group.location ? (
                        <small className="text-muted">
                          {group.location}
                        </small>
                      ) : (
                        <small className="text-muted">-</small>
                      )}
                    </td>
                    <td>
                      <div>
                        <div className="fw-bold">{group.member_count || 0}</div>
                        <small className="text-muted">members</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg={group.privacy === 'public' ? 'success' : 'secondary'} className="text-white">
                        <i className="ti ti-users me-1"></i> {group.group_type || 'location-based'}
                      </Badge>
                      <div className="mt-1">
                        <small className="text-muted">
                          {group.post_count || 0} posts, {group.event_count || 0} events
                        </small>
                      </div>
                    </td>
                    <td>
                      <Badge bg={group.status === 'active' ? 'success' : 'secondary'}>
                        {group.status || 'active'}
                      </Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(group.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <Link
                          href={`/groups/${group.slug}`}
                          className="btn btn-link text-info p-1 border-0"
                          title="View details"
                          style={{ width: "32px", height: "32px" }}
                        >
                          <i className="ti ti-eye"></i>
                        </Link>
                        {isOwner && (
                          <>
                            <button
                              type="button"
                              className="btn btn-link text-primary p-1 border-0"
                              onClick={() => handleEdit(group)}
                              title="Edit group"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <i className="ti ti-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-link text-danger p-1 border-0"
                              onClick={() => handleDelete(group)}
                              title="Delete group"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <FaUsers className="text-muted mb-3" size={64} />
            <h5 className="text-muted mb-3">No groups found</h5>
            <p className="text-muted mb-4">
              {searchTerm || locationFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Be the first to create a farming group in your area!'}
            </p>
            <Button
              variant="success"
              onClick={handleAdd}
            >
              <FaPlus className="me-2" />
              Create New Group
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Group Form Modal */}
      <GroupForm
        show={showForm}
        onHide={handleCloseForm}
        onSuccess={fetchGroups}
        group={selectedGroup}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete "${selectedGroup?.name}"? This action cannot be undone and will remove all group data.`}
        loading={deleteLoading}
      />
    </Container>
  );
}

