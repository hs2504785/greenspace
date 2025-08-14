import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mockOrders } from '@/data/mockOrders';

export async function POST() {
  try {
    // Insert orders
    for (const order of mockOrders) {
      // Insert order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: order.id,
          user_id: order.user_id,
          seller_id: order.seller_id,
          status: order.status,
          total: order.total,
          delivery_address: order.delivery_address,
          contact_number: order.contact_number,
          created_at: order.created_at,
          updated_at: order.updated_at
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Insert order items
      const orderItems = order.items.map(item => ({
        order_id: order.id,
        vegetable_id: item.vegetable.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mock data inserted successfully'
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
