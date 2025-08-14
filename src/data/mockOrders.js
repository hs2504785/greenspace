export const mockOrders = [
  {
    id: 'ORD001',
    user_id: '285edcac-844f-401b-aba4-e59596da3b54', // Rahul's ID from the database
    seller_id: '285edcac-844f-401b-aba4-e59596da3b54', // Using Rahul as seller too for now
    status: 'pending',
    total: 110.00,
    delivery_address: '123 Main St, Mumbai, Maharashtra',
    contact_number: '9876543210',
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z',
    seller: {
      id: '285edcac-844f-401b-aba4-e59596da3b54',
      name: 'Rahul Sharma',
      location: 'Pune',
      whatsapp: '919876543210'
    },
    items: [
      {
        id: 'item1',
        order_id: 'ORD001',
        vegetable_id: 'd008ed6d-69d9-4899-811c-1065aaa2175f', // Spinach ID from the database
        quantity: 2,
        price: 40,
        vegetable: {
          id: 'd008ed6d-69d9-4899-811c-1065aaa2175f',
          name: 'Fresh Spinach',
          description: 'Organic spinach grown without pesticides',
          category: 'leafy',
          images: ['/images/spinach.jpg']
        }
      }
    ]
  },
  {
    id: 'ORD002',
    user_id: '285edcac-844f-401b-aba4-e59596da3b54',
    seller_id: '285edcac-844f-401b-aba4-e59596da3b54',
    status: 'delivered',
    total: 135.00,
    delivery_address: '456 Park Road, Mumbai, Maharashtra',
    contact_number: '9876543210',
    created_at: '2024-02-09T15:30:00Z',
    updated_at: '2024-02-09T18:30:00Z',
    seller: {
      id: '285edcac-844f-401b-aba4-e59596da3b54',
      name: 'Rahul Sharma',
      location: 'Pune',
      whatsapp: '919876543211'
    },
    items: [
      {
        id: 'item3',
        order_id: 'ORD002',
        vegetable_id: 'd008ed6d-69d9-4899-811c-1065aaa2175f',
        quantity: 3,
        price: 45,
        vegetable: {
          id: 'd008ed6d-69d9-4899-811c-1065aaa2175f',
          name: 'Fresh Spinach',
          description: 'Organic spinach grown without pesticides',
          category: 'leafy',
          images: ['/images/spinach.jpg']
        }
      }
    ]
  }
];