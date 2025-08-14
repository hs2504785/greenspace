import ApiBaseService from './ApiBaseService';
import { supabase } from '@/lib/supabase';
import { mockOrders } from '@/data/mockOrders';

class OrderService extends ApiBaseService {
  constructor() {
    super('orders');
  }

  async getOrdersByUser(userId) {
    try {
      console.log('Fetching orders for user:', userId);
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          seller:users!seller_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          buyer:users!user_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          items:order_items(
            id, quantity, price_per_unit, total_price,
            vegetable:vegetables(
              id, name, description, category, images, owner_id
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getOrdersByUser:', error);
      throw error;
    }
  }

  async getOrdersBySeller(sellerId) {
    try {
      console.log('Fetching orders for seller:', sellerId);
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!user_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          items:order_items(
            id, quantity, price_per_unit, total_price,
            vegetable:vegetables(
              id, name, description, category, images, owner_id
            )
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching seller orders:', error);
        throw error;
      }

      console.log('Seller orders fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getOrdersBySeller:', error);
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      console.log('Fetching order details:', { id });
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          seller:users!seller_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          items:order_items(
            id, quantity, price_per_unit, total_price,
            vegetable:vegetables(
              id, name, description, category, images, owner_id
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrderById:', error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      console.log('Creating order with data:', {
        userId: orderData.userId,
        sellerId: orderData.sellerId,
        total: orderData.total,
        items: orderData.items
      });

      if (!supabase) throw new Error('Supabase not initialized');
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.userId,
          seller_id: orderData.sellerId,
          status: 'pending',
          total_amount: orderData.total,
          delivery_address: orderData.deliveryAddress,
          contact_number: orderData.contactNumber,
          created_at: new Date().toISOString()
        }])
        .select('*')
        .single();

      if (orderError) {
        console.error('Error creating order:', {
          error: orderError,
          data: orderData
        });
        throw orderError;
      }

      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        vegetable_id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw itemsError;
      }

      // Fetch the complete order with relationships
      const { data: completeOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          seller:users!seller_id(
            id, name, email, location, whatsapp_number, avatar_url
          ),
          items:order_items(
            id, quantity, price_per_unit, total_price,
            vegetable:vegetables(
              id, name, description, category, images, owner_id
            )
          )
        `)
        .eq('id', order.id)
        .single();

      if (fetchError) {
        console.error('Error fetching complete order:', fetchError);
        throw fetchError;
      }

      return completeOrder;
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  }

  async updateOrderStatus(id, status) {
    try {
      console.log('Updating order status:', { id, status });
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw error;
    }
  }
}

export default new OrderService();