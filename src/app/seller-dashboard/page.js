'use client';

import { Container, Row, Col, Card, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { useUserRole } from '@/hooks/useUserRole';
import { useSellerOrders } from '@/hooks/useSellerOrders';
import SellerGuard from '@/components/common/SellerGuard';
import { useState } from 'react';
// Using native JavaScript date formatting instead of date-fns

function SellerOrderCard({ order, onUpdateStatus }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'preparing':
        return 'primary';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
  };

  return (
    <Card className="mb-3 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1">Order #{order.id.slice(-8)}</h6>
            <small className="text-muted">
              {new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit', 
                year: 'numeric'
              })} at {new Date(order.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </small>
          </div>
          <Badge bg={getStatusColor(order.status)} className="text-capitalize">
            {order.status}
          </Badge>
        </div>

        {/* User profile on left, Address & WhatsApp on right */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <div 
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
              style={{ width: '28px', height: '28px', fontSize: '12px' }}
            >
              {order.buyer?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <strong className="mb-0">{order.buyer?.name || 'Unknown Customer'}</strong>
              <div className="text-muted small">{order.buyer?.email}</div>
            </div>
          </div>
          
          {/* Address and WhatsApp button together on right */}
          <div className="text-end">
            {order.delivery_address && (
              <div className="small text-muted mb-1">
                <i className="ti-location-pin me-1"></i>
                {order.delivery_address.length > 25 ? 
                  order.delivery_address.substring(0, 25) + '...' : 
                  order.delivery_address}
              </div>
            )}
            {order.buyer?.whatsapp_number && (
              <Button 
                size="sm" 
                variant="outline-success" 
                href={`https://wa.me/${order.buyer.whatsapp_number.replace(/[^0-9]/g, '')}?text=Hello! Your order #${order.id.slice(-8)} status update...`}
                target="_blank"
                className="py-1 px-2"
              >
                <i className="ti-brand-whatsapp me-1"></i>
                WhatsApp
              </Button>
            )}
          </div>
        </div>

        {/* Items section below on left with total amount on right */}
        <div className="d-flex justify-content-between align-items-center mb-1">
          <strong className="text-muted small">ITEMS ({order.items?.length || 0})</strong>
          <strong className="text-success">₹{order.total_amount}</strong>
        </div>

        {/* Compact items list */}
        <div className="mb-2">
          {order.items?.map((item, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center">
              <small>{item.vegetable?.name || 'Unknown Item'}</small>
              <small className="text-muted">
                {item.quantity} × ₹{item.price_per_unit} = ₹{item.total_price}
              </small>
            </div>
          ))}
        </div>

        <div className="d-flex gap-2">
          {order.status === 'pending' && (
            <>
              <Button 
                size="sm" 
                variant="success" 
                onClick={() => handleStatusChange('confirmed')}
              >
                Confirm Order
              </Button>
              <Button 
                size="sm" 
                variant="outline-danger" 
                onClick={() => handleStatusChange('cancelled')}
              >
                Cancel
              </Button>
            </>
          )}
          {order.status === 'confirmed' && (
            <Button 
              size="sm" 
              variant="primary" 
              onClick={() => handleStatusChange('preparing')}
            >
              Start Preparing
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button 
              size="sm" 
              variant="success" 
              onClick={() => handleStatusChange('ready')}
            >
              Mark Ready
            </Button>
          )}
          {order.status === 'ready' && (
            <Button 
              size="sm" 
              variant="success" 
              onClick={() => handleStatusChange('delivered')}
            >
              Mark Delivered
            </Button>
          )}

        </div>
      </Card.Body>
    </Card>
  );
}

function SellerDashboardContent() {
  const { orders, loading, filters, updateFilters, updateOrderStatus } = useSellerOrders();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ searchQuery });
  };

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your orders...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-3">
            <i className="ti-package me-3" style={{ fontSize: '2rem' }}></i>
            <div>
              <h1 className="h3 mb-0">Seller Dashboard</h1>
              <p className="text-muted mb-0">Manage orders from your customers</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="h2 text-primary mb-1">{statusCounts.total || 0}</div>
              <div className="text-muted">Total Orders</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="h2 text-warning mb-1">{statusCounts.pending || 0}</div>
              <div className="text-muted">Pending</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="h2 text-info mb-1">{statusCounts.confirmed || 0}</div>
              <div className="text-muted">Confirmed</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="h2 text-success mb-1">{statusCounts.delivered || 0}</div>
              <div className="text-muted">Delivered</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search orders by order ID, customer name, or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-secondary" type="submit">
                <i className="ti-search"></i>
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.period}
            onChange={(e) => updateFilters({ period: e.target.value })}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="year">This Year</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Orders List */}
      <Row>
        <Col>
          {orders.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="ti-package" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
                <h4 className="mt-3 mb-2">No Orders Found</h4>
                <p className="text-muted">
                  {filters.status !== 'all' || filters.searchQuery 
                    ? 'No orders match your current filters.' 
                    : 'You haven\'t received any orders yet.'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            orders.map((order) => (
              <SellerOrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={updateOrderStatus}
              />
            ))
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default function SellerDashboardPage() {
  return (
    <SellerGuard>
      <SellerDashboardContent />
    </SellerGuard>
  );
}
