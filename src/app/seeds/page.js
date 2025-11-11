"use client";

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Table, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { FaSeedling, FaPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import SeedForm from '@/components/features/seeds/SeedForm';
import SearchInput from '@/components/common/SearchInput';

export default function ManageSeedsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seeds, setSeeds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please sign in to manage seeds');
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSeeds();
      fetchCategories();
    }
  }, [status, router]);
  
  const fetchSeeds = async () => {
    try {
      setLoading(true);
      // Fetch only current user's seeds
      const response = await fetch(`/api/seeds?userId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch seeds');
      }
      
      const data = await response.json();
      setSeeds(data || []);
    } catch (error) {
      console.error('Error fetching seeds:', error);
      toast.error('Failed to load seeds');
      setSeeds([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/seeds/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleAdd = () => {
    setSelectedSeed(null);
    setShowForm(true);
  };

  const handleEdit = (seed) => {
    setSelectedSeed(seed);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedSeed(null);
  };

  const handleDelete = (seed) => {
    setSelectedSeed(seed);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSeed) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/seeds/${selectedSeed.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete seed');
      }

      toast.success('Seed deleted successfully');
      setShowDeleteModal(false);
      setSelectedSeed(null);
      fetchSeeds();
    } catch (error) {
      console.error('Error deleting seed:', error);
      toast.error('Failed to delete seed');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter seeds
  const filteredSeeds = seeds.filter(seed => {
    const matchesSearch = 
      seed.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seed.variety?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seed.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === 'all' || seed.category_id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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
            <FaSeedling className="text-success me-2" />
            Manage Your Seeds
          </h2>
          <p className="text-muted mb-0">
            Add, edit, or remove your seed listings
          </p>
        </div>
        <Button
          variant="success"
          size="lg"
          onClick={handleAdd}
        >
          <FaPlus className="me-2" />
          Add New Seed
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Seeds</p>
                  <h3 className="mb-0">{seeds.length}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                  <FaSeedling className="text-primary" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Active</p>
                  <h3 className="mb-0">{seeds.filter(s => s.status === 'active').length}</h3>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                  <i className="ti ti-check text-success" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Free Seeds</p>
                  <h3 className="mb-0">{seeds.filter(s => s.is_free).length}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                  <i className="ti ti-gift text-warning" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Heirloom</p>
                  <h3 className="mb-0">{seeds.filter(s => s.is_heirloom).length}</h3>
                </div>
                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                  <i className="ti ti-star text-info" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search seeds by name, variety..."
              />
            </Col>
            <Col md={4}>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Seeds Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3">Loading your seeds...</p>
        </div>
      ) : filteredSeeds.length > 0 ? (
        <div className="table-responsive">
          <Table
            hover
            className="mb-0 bg-white rounded-3 shadow-sm overflow-hidden"
          >
            <thead className="table-light">
              <tr>
                <th className="border-0 ps-3">Product</th>
                <th className="border-0">Price</th>
                <th className="border-0">Quantity</th>
                <th className="border-0">Category</th>
                <th className="border-0">Status</th>
                <th className="border-0">Created</th>
                <th className="border-0 text-center" style={{ width: "120px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSeeds.map(seed => (
                <tr key={seed.id} className="align-middle">
                  <td className="ps-3">
                    <div className="d-flex align-items-center">
                      {seed.images?.[0] ? (
                        <img
                          src={seed.images[0]}
                          alt={seed.name}
                          className="rounded me-3 flex-shrink-0"
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-light rounded me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 40, height: 40 }}
                        >
                          <FaSeedling className="text-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="fw-bold text-truncate">
                          {seed.name}
                        </div>
                        {seed.variety && (
                          <small className="text-muted d-block text-truncate">
                            {seed.variety}
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {seed.is_free ? (
                      <Badge bg="success">Free</Badge>
                    ) : (
                      <div>
                        <div className="fw-bold text-success">
                          ₹{seed.price}
                        </div>
                        <small className="text-muted">
                          per {seed.quantity_unit}
                        </small>
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <div className={seed.quantity_available > 0 ? "fw-bold" : "text-danger fw-bold"}>
                        {seed.quantity_available}
                      </div>
                      <small className="text-muted">
                        {seed.quantity_unit} available
                      </small>
                    </div>
                  </td>
                  <td>
                    {seed.category && (
                      <Badge 
                        bg={seed.is_heirloom ? "warning" : seed.is_free ? "success" : "primary"}
                        className="text-dark"
                      >
                        {seed.category.icon} {seed.category.name}
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Badge bg={seed.status === 'active' ? 'success' : 'secondary'}>
                      {seed.status}
                    </Badge>
                  </td>
                  <td>
                    <small className="text-muted">
                      {new Date(seed.created_at).toLocaleDateString()}
                    </small>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Link
                        href={`/seeds/${seed.id}`}
                        className="btn btn-link text-info p-1 border-0"
                        title="View details"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <i className="ti ti-eye"></i>
                      </Link>
                      <button
                        type="button"
                        className="btn btn-link text-primary p-1 border-0"
                        onClick={() => handleEdit(seed)}
                        title="Edit seed"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <i className="ti ti-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-link text-danger p-1 border-0"
                        onClick={() => handleDelete(seed)}
                        title="Delete seed"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <FaSeedling className="text-muted mb-3" size={64} />
            <h5 className="text-muted mb-3">No seeds found</h5>
            <p className="text-muted mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Start by adding your first seed listing!'}
            </p>
            <Button
              variant="success"
              onClick={handleAdd}
            >
              <FaPlus className="me-2" />
              Add Your First Seed
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Seed Form Modal */}
      <SeedForm
        show={showForm}
        onHide={handleCloseForm}
        onSuccess={fetchSeeds}
        seed={selectedSeed}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Seed"
        message={`Are you sure you want to delete "${selectedSeed?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </Container>
  );
}
