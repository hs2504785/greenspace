'use client';

import { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import OrderService from '@/services/OrderService';
import { generateOrderStatusMessage, openWhatsApp } from '@/utils/whatsapp';

const STATUS_FLOW = {
  pending: {
    next: 'confirmed',
    icon: 'ti-timer',
    color: 'warning',
    description: 'Order placed and waiting for confirmation'
  },
  confirmed: {
    next: 'processing',
    icon: 'ti-check',
    color: 'info',
    description: 'Order confirmed by seller'
  },
  processing: {
    next: 'shipped',
    icon: 'ti-reload',
    color: 'primary',
    description: 'Order is being prepared'
  },
  shipped: {
    next: 'delivered',
    icon: 'ti-truck',
    color: 'success',
    description: 'Order is out for delivery'
  },
  delivered: {
    next: null,
    icon: 'ti-package',
    color: 'success',
    description: 'Order has been delivered'
  },
  cancelled: {
    next: null,
    icon: 'ti-close',
    color: 'danger',
    description: 'Order has been cancelled'
  }
};

export default function OrderTimeline({ order }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status);

  const isSeller = session?.user?.id === order.seller_id;
  const canUpdateStatus = isSeller && STATUS_FLOW[currentStatus]?.next;

  const handleUpdateStatus = async () => {
    const nextStatus = STATUS_FLOW[currentStatus].next;
    if (!nextStatus) return;

    setLoading(true);
    try {
      await OrderService.updateOrderStatus(order.id, nextStatus);
      setCurrentStatus(nextStatus);
      toast.success('Order status updated to ' + nextStatus);

      // Send WhatsApp notification if status has a message
      const message = generateOrderStatusMessage(order, nextStatus);
      if (message && order.contact_number) {
        openWhatsApp(order.contact_number, message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const getTimelineItems = () => {
    const items = [];
    let current = 'pending';
    
    while (current) {
      const status = STATUS_FLOW[current];
      const isActive = current === currentStatus;
      const isPast = getStatusWeight(current) < getStatusWeight(currentStatus);
      
      items.push(
        <div 
          key={current}
          className={'timeline-item ' + (isActive ? 'active' : '') + (isPast ? ' past' : '')}
        >
          <div className={'timeline-icon bg-' + status.color}>
            <i className={status.icon}></i>
          </div>
          <div className="timeline-content">
            <h6 className="mb-1">
              {current.charAt(0).toUpperCase() + current.slice(1)}
            </h6>
            <p className="mb-0 small text-muted">
              {status.description}
            </p>
            {isActive && canUpdateStatus && (
              <Button
                variant={'outline-' + status.color}
                size="sm"
                className="mt-2"
                onClick={handleUpdateStatus}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className={STATUS_FLOW[status.next]?.icon + " me-1"}></i>
                    Mark as {status.next}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      );

      if (current === 'cancelled' || current === currentStatus) break;
      current = status.next;
    }

    return items;
  };

  return (
    <Card>
      <Card.Header>
        <i className="ti-time me-2"></i>
        Order Timeline
      </Card.Header>
      <Card.Body>
        <div className="timeline">
          {getTimelineItems()}
        </div>
      </Card.Body>
    </Card>
  );
}

function getStatusWeight(status) {
  const weights = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1
  };
  return weights[status] || 0;
}