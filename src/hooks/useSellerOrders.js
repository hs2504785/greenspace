'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import OrderService from '@/services/OrderService';

export function useSellerOrders(initialFilters = {}) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    period: 'all',
    searchQuery: '',
    ...initialFilters
  });

  const fetchSellerOrders = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        console.warn('No user ID in session');
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log('Fetching seller orders for user:', session.user.id);
      let data = await OrderService.getOrdersBySeller(session.user.id);

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        data = data.filter(order => order.status === filters.status);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        data = data.filter(order => 
          order.id.toLowerCase().includes(query) ||
          order.buyer?.name?.toLowerCase().includes(query) ||
          order.items?.some(item => 
            item.vegetable?.name?.toLowerCase().includes(query)
          )
        );
      }

      // Apply time period filter
      if (filters.period !== 'all') {
        const now = new Date();
        
        switch (filters.period) {
          case 'today':
            data = data.filter(order => 
              new Date(order.created_at).toDateString() === now.toDateString()
            );
            break;
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            data = data.filter(order => 
              new Date(order.created_at) >= weekAgo
            );
            break;
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            data = data.filter(order => 
              new Date(order.created_at) >= monthAgo
            );
            break;
          case '3months':
            const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
            data = data.filter(order => 
              new Date(order.created_at) >= threeMonthsAgo
            );
            break;
          case 'year':
            const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
            data = data.filter(order => 
              new Date(order.created_at) >= yearAgo
            );
            break;
        }
      }

      console.log('Filtered seller orders:', data?.length || 0);
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching seller orders:', err);
      setError(err.message || 'Failed to fetch seller orders');
      toast.error('Failed to load seller orders');
    } finally {
      setLoading(false);
    }
  }, [session, filters]);

  useEffect(() => {
    if (session) {
      fetchSellerOrders();
    }
  }, [session, fetchSellerOrders]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await OrderService.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      // Refresh orders
      await fetchSellerOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    error,
    filters,
    updateFilters,
    updateOrderStatus,
    refreshOrders: fetchSellerOrders
  };
}
