-- =====================================================
-- SEED EXCHANGE NETWORK TABLES
-- Arya Natural Farms - Community Feature
-- =====================================================

-- 1. Seed Categories Table
CREATE TABLE IF NOT EXISTS seed_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO seed_categories (name, description, icon, display_order) VALUES
('Vegetables', 'Vegetable seeds for kitchen gardens', '🥬', 1),
('Fruits', 'Fruit seeds and saplings', '🍎', 2),
('Herbs', 'Medicinal and culinary herbs', '🌿', 3),
('Flowers', 'Flowering plants and ornamentals', '🌸', 4),
('Trees', 'Tree saplings and seeds', '🌳', 5),
('Legumes', 'Beans, peas, and pulses', '🫘', 6),
('Grains', 'Cereal and grain seeds', '🌾', 7),
('Others', 'Other seed varieties', '🌱', 8)
ON CONFLICT (name) DO NOTHING;

-- 2. Seeds Table (Main seed listings)
CREATE TABLE IF NOT EXISTS seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES seed_categories(id),
  
  -- Basic Information
  name TEXT NOT NULL,
  scientific_name TEXT,
  variety TEXT, -- e.g., "Cherry Tomato", "Heirloom"
  description TEXT,
  
  -- Seed Details
  seed_type TEXT CHECK (seed_type IN ('seed', 'sapling', 'cutting', 'bulb', 'tuber')),
  is_heirloom BOOLEAN DEFAULT false,
  is_open_pollinated BOOLEAN DEFAULT false,
  is_hybrid BOOLEAN DEFAULT false,
  
  -- Availability
  quantity_available INTEGER DEFAULT 0,
  quantity_unit TEXT DEFAULT 'packets', -- packets, grams, pieces, etc.
  price DECIMAL(10, 2) DEFAULT 0, -- 0 means free/exchange
  is_free BOOLEAN DEFAULT false,
  is_for_exchange BOOLEAN DEFAULT true, -- willing to exchange
  
  -- Growing Information
  growing_season TEXT[], -- ['Spring', 'Monsoon', 'Winter']
  days_to_germination INTEGER,
  days_to_harvest INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  growing_tips TEXT,
  
  -- Origin & Source
  origin_location TEXT, -- Where seeds were collected
  year_collected INTEGER,
  source_info TEXT, -- "Saved from my garden", "From farmer in XYZ"
  
  -- Media
  images TEXT[], -- Array of image URLs
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'out_of_stock', 'inactive')),
  
  -- Location (from user profile, cached for performance)
  location TEXT,
  coordinates JSONB, -- {lat, lon}
  
  -- Metadata
  views_count INTEGER DEFAULT 0,
  exchange_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed Exchange Requests
CREATE TABLE IF NOT EXISTS seed_exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id UUID NOT NULL REFERENCES seeds(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request Details
  request_type TEXT CHECK (request_type IN ('purchase', 'exchange', 'free_claim')),
  quantity_requested INTEGER NOT NULL,
  message TEXT, -- Personal message to owner
  
  -- Exchange Offer (if exchange request)
  exchange_seed_id UUID REFERENCES seeds(id), -- Seed offered in exchange
  exchange_notes TEXT,
  
  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  response_message TEXT, -- Owner's response
  
  -- Meetup Details
  meetup_location TEXT,
  meetup_date TIMESTAMPTZ,
  meetup_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 4. Seed Reviews & Ratings
CREATE TABLE IF NOT EXISTS seed_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id UUID NOT NULL REFERENCES seeds(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange_request_id UUID REFERENCES seed_exchange_requests(id),
  
  -- Review Content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  germination_rate INTEGER CHECK (germination_rate >= 0 AND germination_rate <= 100),
  title TEXT,
  review_text TEXT,
  images TEXT[],
  
  -- Growing Results
  successfully_grown BOOLEAN,
  harvest_date DATE,
  harvest_notes TEXT,
  
  -- Metadata
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: One review per user per seed
  UNIQUE(seed_id, reviewer_id)
);

-- 5. Seed Wishlist
CREATE TABLE IF NOT EXISTS seed_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Wishlist Item
  seed_name TEXT NOT NULL,
  category_id UUID REFERENCES seed_categories(id),
  variety TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Status
  is_fulfilled BOOLEAN DEFAULT false,
  fulfilled_by_seed_id UUID REFERENCES seeds(id),
  fulfilled_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, seed_name, variety)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_seeds_user_id ON seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_seeds_category_id ON seeds(category_id);
CREATE INDEX IF NOT EXISTS idx_seeds_status ON seeds(status);
CREATE INDEX IF NOT EXISTS idx_seeds_is_free ON seeds(is_free);
CREATE INDEX IF NOT EXISTS idx_seeds_created_at ON seeds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seeds_coordinates ON seeds USING GIN(coordinates);

CREATE INDEX IF NOT EXISTS idx_exchange_requests_seed_id ON seed_exchange_requests(seed_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester_id ON seed_exchange_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_owner_id ON seed_exchange_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_status ON seed_exchange_requests(status);

CREATE INDEX IF NOT EXISTS idx_seed_reviews_seed_id ON seed_reviews(seed_id);
CREATE INDEX IF NOT EXISTS idx_seed_reviews_reviewer_id ON seed_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_seed_wishlists_user_id ON seed_wishlists(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_categories ENABLE ROW LEVEL SECURITY;

-- Seed Categories - Public read access
CREATE POLICY "Seed categories are viewable by everyone" ON seed_categories
  FOR SELECT USING (true);

-- Seeds Policies
CREATE POLICY "Seeds are viewable by everyone" ON seeds
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own seeds" ON seeds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seeds" ON seeds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seeds" ON seeds
  FOR DELETE USING (auth.uid() = user_id);

-- Exchange Requests Policies
CREATE POLICY "Users can view their own exchange requests" ON seed_exchange_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create exchange requests" ON seed_exchange_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Owners can update exchange requests" ON seed_exchange_requests
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = requester_id);

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone" ON seed_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON seed_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON seed_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Wishlist Policies
CREATE POLICY "Users can view their own wishlist" ON seed_wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlist" ON seed_wishlists
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_seeds_updated_at ON seeds;
DROP TRIGGER IF EXISTS update_exchange_requests_updated_at ON seed_exchange_requests;
DROP TRIGGER IF EXISTS update_seed_reviews_updated_at ON seed_reviews;

-- Create triggers
CREATE TRIGGER update_seeds_updated_at BEFORE UPDATE ON seeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_requests_updated_at BEFORE UPDATE ON seed_exchange_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seed_reviews_updated_at BEFORE UPDATE ON seed_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UPDATE EXCHANGE COUNT TRIGGER
-- =====================================================

-- Function to update exchange count when request is completed
CREATE OR REPLACE FUNCTION update_seed_exchange_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE seeds SET exchange_count = exchange_count + 1 WHERE id = NEW.seed_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_exchange_count ON seed_exchange_requests;
CREATE TRIGGER update_exchange_count AFTER UPDATE ON seed_exchange_requests
  FOR EACH ROW EXECUTE FUNCTION update_seed_exchange_count();

-- =====================================================
-- SEED EXCHANGE SYSTEM SUCCESSFULLY CREATED!
-- Next steps:
-- 1. Run this SQL file in Supabase SQL Editor
-- 2. Verify all tables are created
-- 3. Test RLS policies
-- 4. Create API endpoints
-- =====================================================

