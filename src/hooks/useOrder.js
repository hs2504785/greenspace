'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import OrderService from '@/services/OrderService';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export function useOrder(orderId) {
  const { data: session } = useSession();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Invalid order ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching order:', orderId);
        const data = await OrderService.getOrderById(orderId);
        console.log('Fetched order data:', data);

        if (!data) {
          console.log('No order data found');
          setError('Order not found');
          return;
        }

        // For mock data or initial testing, skip permission check
        if (!supabase) {
          console.log('Using mock data, skipping permission check');
          setOrder(data);
          return;
        }

        // Only check permissions if we have a session and are using Supabase
        if (session?.user?.id) {
          if (data.user_id !== session.user.id && data.seller_id !== session.user.id) {
            setError('You do not have permission to view this order');
            return;
          }
        }

        setOrder(data);
      } catch (err) {
        console.error('Error in useOrder hook:', err);
        setError('Failed to load order details');
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, session]);

  return { order, loading, error };
}