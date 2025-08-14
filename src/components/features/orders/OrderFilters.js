'use client';

import { Card, Form } from 'react-bootstrap';

const ORDER_STATUSES = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const TIME_PERIODS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' }
];

export default function OrderFilters({ filters, onFilterChange }) {
  const handleChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  return (
    <Card>
      <Card.Header>
        <i className="ti-filter me-2"></i>
        Filters
      </Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Order Status</Form.Label>
            <Form.Select
              value={filters.status || 'all'}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {ORDER_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Time Period</Form.Label>
            <Form.Select
              value={filters.period || 'all'}
              onChange={(e) => handleChange('period', e.target.value)}
            >
              {TIME_PERIODS.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Search Orders</Form.Label>
            <Form.Control
              type="text"
              placeholder="Order #, items, seller..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleChange('searchQuery', e.target.value)}
            />
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
}
