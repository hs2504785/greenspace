-- Insert orders
INSERT INTO orders (
  id,
  user_id,
  seller_id,
  status,
  delivery_address,
  contact_number,
  created_at,
  updated_at
) VALUES 
(
  'ORD001',
  '285edcac-844f-401b-aba4-e59596da3b54', -- Rahul's ID (buyer)
  '285edcac-844f-401b-aba4-e59596da3b54', -- Rahul's ID (seller)
  'pending',
  '123 Main St, Mumbai, Maharashtra',
  '9876543210',
  '2024-02-10T10:00:00Z',
  '2024-02-10T10:00:00Z'
),
(
  'ORD002',
  '285edcac-844f-401b-aba4-e59596da3b54', -- Rahul's ID (buyer)
  '285edcac-844f-401b-aba4-e59596da3b54', -- Rahul's ID (seller)
  'delivered',
  '456 Park Road, Mumbai, Maharashtra',
  '9876543210',
  '2024-02-09T15:30:00Z',
  '2024-02-09T18:30:00Z'
);

-- Insert order items
INSERT INTO order_items (
  id,
  order_id,
  vegetable_id,
  quantity,
  price
) VALUES 
(
  'item1',
  'ORD001',
  'd008ed6d-69d9-4899-811c-1065aaa2175f', -- Spinach ID
  2,
  40
),
(
  'item3',
  'ORD002',
  'd008ed6d-69d9-4899-811c-1065aaa2175f', -- Spinach ID
  3,
  45
);