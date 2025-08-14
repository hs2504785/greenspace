-- Insert test users and store their IDs in variables
WITH inserted_users AS (
  INSERT INTO users (email, name, role, location)
  VALUES
    ('rahul.sharma@example.com', 'Rahul Sharma', 'user', 'Pune'),
    ('priya.patel@example.com', 'Priya Patel', 'user', 'Mumbai'),
    ('amit.kumar@example.com', 'Amit Kumar', 'user', 'Bangalore'),
    ('sneha.reddy@example.com', 'Sneha Reddy', 'user', 'Hyderabad'),
    ('smriti@example.com', 'Smriti', 'user', 'Hyderabad')
  RETURNING id, name
)
-- Insert vegetables using the returned user IDs
INSERT INTO vegetables (
  name, 
  description, 
  price, 
  quantity, 
  category, 
  images, 
  owner_id, 
  location, 
  source_type
)
SELECT
  v.name,
  v.description,
  v.price,
  v.quantity,
  v.category,
  v.images,
  u.id as owner_id,
  v.location,
  v.source_type
FROM (
  VALUES
    ('Fresh Spinach', 'Organic spinach grown without pesticides', 40.00, 50, 'leafy', ARRAY['/images/spinach.jpg'], 'Rahul Sharma', 'Pune', 'farm'),
    ('Red Tomatoes', 'Fresh, ripe tomatoes perfect for salads', 30.00, 100, 'fruit', ARRAY['/images/tomato.jpg'], 'Priya Patel', 'Mumbai', 'home_garden'),
    ('Organic Carrots', 'Sweet and crunchy carrots', 35.00, 75, 'root', ARRAY['/images/carrots.jpg'], 'Amit Kumar', 'Bangalore', 'farm'),
    ('Fresh Mint', 'Aromatic mint leaves for cooking and garnishing', 20.00, 30, 'herbs', ARRAY['/images/mint.jpg'], 'Sneha Reddy', 'Hyderabad', 'home_garden'),
    ('Ridge Guard', 'Ridge Guard is a vegetable that is grown in the hills of India', 20.00, 30, 'vegetable', ARRAY['/images/ridge-gourd.jpg'], 'Smriti', 'Hyderabad', 'home_garden'),
    ('Fresh Okra', 'Tender and fresh okra, perfect for Indian dishes', 25.00, 40, 'vegetable', ARRAY['/images/okra.jpg'], 'Smriti', 'Hyderabad', 'home_garden'),
    ('Green Chillies', 'Fresh and spicy green chillies from organic garden', 15.00, 25, 'spice', ARRAY['/images/green-chillies.jpg'], 'Smriti', 'Hyderabad', 'home_garden'),
    ('Curry Leaves', 'Fresh curry leaves, essential for South Indian cooking', 10.00, 20, 'herbs', ARRAY['/images/curry-leaves.jpg'], 'Smriti', 'Hyderabad', 'home_garden'),
    ('Bottle Gourd', 'Fresh and tender bottle gourd, perfect for healthy recipes', 30.00, 35, 'vegetable', ARRAY['/images/bottle-gourd.jpg'], 'Smriti', 'Hyderabad', 'home_garden')
) as v(name, description, price, quantity, category, images, owner_name, location, source_type)
JOIN inserted_users u ON u.name = v.owner_name;
