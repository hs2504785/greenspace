# Community Features Implementation Plan

> **Features to Implement:**
> 1. **Seed Exchange Network** 🌱
> 2. **Local Farming Groups** 🤝
> 3. **Community Impact Dashboard** 📊

---

## 🎯 Implementation Strategy

We'll implement these features in phases, building on your existing infrastructure (Next.js, Supabase, Bootstrap 5, React).

---

## 📋 FEATURE #1: SEED EXCHANGE NETWORK 🌱

### Overview
Allow community members to share, exchange, and sell seeds/saplings - preserving heirloom varieties and reducing costs.

### Phase 1.1: Database Schema Setup

#### Step 1.1.1: Create Database Tables

**File:** `database/create-seed-exchange-system.sql`

```sql
-- =====================================================
-- SEED EXCHANGE NETWORK TABLES
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
('Others', 'Other seed varieties', '🌱', 8);

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

CREATE INDEX idx_seeds_user_id ON seeds(user_id);
CREATE INDEX idx_seeds_category_id ON seeds(category_id);
CREATE INDEX idx_seeds_status ON seeds(status);
CREATE INDEX idx_seeds_is_free ON seeds(is_free);
CREATE INDEX idx_seeds_created_at ON seeds(created_at DESC);
CREATE INDEX idx_seeds_coordinates ON seeds USING GIN(coordinates);

CREATE INDEX idx_exchange_requests_seed_id ON seed_exchange_requests(seed_id);
CREATE INDEX idx_exchange_requests_requester_id ON seed_exchange_requests(requester_id);
CREATE INDEX idx_exchange_requests_owner_id ON seed_exchange_requests(owner_id);
CREATE INDEX idx_exchange_requests_status ON seed_exchange_requests(status);

CREATE INDEX idx_seed_reviews_seed_id ON seed_reviews(seed_id);
CREATE INDEX idx_seed_reviews_reviewer_id ON seed_reviews(reviewer_id);

CREATE INDEX idx_seed_wishlists_user_id ON seed_wishlists(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_wishlists ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_seeds_updated_at BEFORE UPDATE ON seeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_requests_updated_at BEFORE UPDATE ON seed_exchange_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seed_reviews_updated_at BEFORE UPDATE ON seed_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Action Items:**
- [ ] Create the SQL file
- [ ] Run migration on Supabase
- [ ] Verify tables created successfully
- [ ] Test RLS policies

---

### Phase 1.2: API Development

#### Step 1.2.1: Create Seeds API Routes

**File:** `src/app/api/seeds/route.js`

```javascript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch all seeds with filters
export async function GET(request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  
  const category = searchParams.get('category');
  const isFree = searchParams.get('isFree');
  const isHeirloom = searchParams.get('isHeirloom');
  const searchQuery = searchParams.get('search');
  const location = searchParams.get('location');
  const radius = parseFloat(searchParams.get('radius')) || 50; // km
  
  try {
    let query = supabase
      .from('seeds')
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar_url,
          location,
          coordinates,
          is_seller
        ),
        category:category_id (
          id,
          name,
          icon
        ),
        reviews:seed_reviews (
          rating
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }
    
    if (isFree === 'true') {
      query = query.eq('is_free', true);
    }
    
    if (isHeirloom === 'true') {
      query = query.eq('is_heirloom', true);
    }
    
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,variety.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    
    const { data: seeds, error } = await query;
    
    if (error) throw error;
    
    // Calculate average ratings
    const enrichedSeeds = seeds.map(seed => ({
      ...seed,
      average_rating: seed.reviews?.length > 0
        ? (seed.reviews.reduce((sum, r) => sum + r.rating, 0) / seed.reviews.length).toFixed(1)
        : null,
      review_count: seed.reviews?.length || 0
    }));
    
    return NextResponse.json(enrichedSeeds);
  } catch (error) {
    console.error('Error fetching seeds:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new seed listing
export async function POST(request) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Get user's location
    const { data: userData } = await supabase
      .from('users')
      .select('location, coordinates')
      .eq('id', user.id)
      .single();
    
    const seedData = {
      ...body,
      user_id: user.id,
      location: userData?.location,
      coordinates: userData?.coordinates,
      status: 'active'
    };
    
    const { data: seed, error } = await supabase
      .from('seeds')
      .insert(seedData)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(seed, { status: 201 });
  } catch (error) {
    console.error('Error creating seed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Additional API files to create:**
- `src/app/api/seeds/[id]/route.js` - Single seed CRUD
- `src/app/api/seeds/exchange/route.js` - Exchange requests
- `src/app/api/seeds/wishlist/route.js` - Wishlist management
- `src/app/api/seeds/categories/route.js` - Categories

---

### Phase 1.3: UI Components

#### Step 1.3.1: Seed Marketplace Page

**File:** `src/app/seeds/page.js`

```javascript
"use client";

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import SeedCard from '@/components/features/seeds/SeedCard';
import SeedFilters from '@/components/features/seeds/SeedFilters';

export default function SeedMarketplace() {
  const [seeds, setSeeds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    isFree: false,
    isHeirloom: false,
    search: ''
  });
  
  useEffect(() => {
    fetchSeeds();
    fetchCategories();
  }, [filters]);
  
  const fetchSeeds = async () => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/seeds?${params}`);
    const data = await response.json();
    setSeeds(data);
    setLoading(false);
  };
  
  const fetchCategories = async () => {
    const response = await fetch('/api/seeds/categories');
    const data = await response.json();
    setCategories(data);
  };
  
  return (
    <Container className="py-4">
      {/* Hero Section */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-success mb-3">
          🌱 Seed Exchange Network
        </h1>
        <p className="lead text-muted">
          Share, exchange, and preserve heirloom seeds with our community
        </p>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Badge bg="info" className="fs-6 px-3 py-2">
            {seeds.length} Seeds Available
          </Badge>
          <Badge bg="success" className="fs-6 px-3 py-2">
            {seeds.filter(s => s.is_heirloom).length} Heirloom Varieties
          </Badge>
          <Badge bg="warning" className="fs-6 px-3 py-2">
            {seeds.filter(s => s.is_free).length} Free Seeds
          </Badge>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="text-center mb-4">
        <Button variant="primary" size="lg" href="/seeds/add" className="me-3">
          <i className="ti-plus me-2"></i>
          List Your Seeds
        </Button>
        <Button variant="outline-success" size="lg" href="/seeds/wishlist">
          <i className="ti-heart me-2"></i>
          My Wishlist
        </Button>
      </div>
      
      {/* Filters */}
      <SeedFilters
        filters={filters}
        onFilterChange={setFilters}
        categories={categories}
      />
      
      {/* Seed Grid */}
      <Row className="g-4 mt-2">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success"></div>
          </div>
        ) : seeds.length > 0 ? (
          seeds.map(seed => (
            <Col key={seed.id} xs={12} sm={6} lg={4} xl={3}>
              <SeedCard seed={seed} />
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <Card className="text-center py-5">
              <Card.Body>
                <i className="ti-search text-muted mb-3" style={{fontSize: '3rem'}}></i>
                <h5 className="text-muted">No seeds found</h5>
                <p className="text-muted">Try adjusting your filters</p>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}
```

---

## 📋 FEATURE #2: LOCAL FARMING GROUPS 🤝

### Overview
Create location-based farming groups for knowledge sharing, meetups, and collaboration.

### Phase 2.1: Database Schema

**File:** `database/create-farming-groups-system.sql`

```sql
-- =====================================================
-- LOCAL FARMING GROUPS TABLES
-- =====================================================

-- 1. Farming Groups
CREATE TABLE IF NOT EXISTS farming_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT CHECK (group_type IN ('neighborhood', 'topic', 'custom')) DEFAULT 'neighborhood',
  
  -- Location (for neighborhood groups)
  center_location TEXT,
  center_coordinates JSONB, -- {lat, lon}
  radius_km DECIMAL(10, 2) DEFAULT 5, -- Auto-include members within radius
  
  -- Topic (for topic-based groups)
  topic_category TEXT, -- composting, organic pest control, etc.
  
  -- Settings
  is_public BOOLEAN DEFAULT true,
  auto_join BOOLEAN DEFAULT true, -- Auto-add nearby members
  requires_approval BOOLEAN DEFAULT false,
  
  -- Media
  cover_image TEXT,
  icon TEXT,
  
  -- Creator
  created_by UUID REFERENCES users(id),
  
  -- Stats
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Group Memberships
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES farming_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'left', 'removed')),
  
  -- Notifications
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  
  UNIQUE(group_id, user_id)
);

-- 3. Group Posts/Discussions
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES farming_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'tip', 'photo', 'announcement')),
  
  -- Media
  images TEXT[],
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Pinned (by admins)
  is_pinned BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Group Post Comments
CREATE TABLE IF NOT EXISTS group_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  
  -- Media
  images TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Group Events
CREATE TABLE IF NOT EXISTS group_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES farming_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Event Details
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('meetup', 'workshop', 'seed_swap', 'farm_visit', 'work_party', 'other')),
  
  -- When
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  
  -- Where
  location TEXT,
  coordinates JSONB,
  online_link TEXT, -- For virtual events
  
  -- Capacity
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  
  -- Media
  images TEXT[],
  
  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES group_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- RSVP
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  
  -- Notes
  notes TEXT, -- "Bringing extra seeds", "Can help setup"
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id, user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_farming_groups_type ON farming_groups(group_type);
CREATE INDEX idx_farming_groups_coordinates ON farming_groups USING GIN(center_coordinates);

CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_status ON group_memberships(status);

CREATE INDEX idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX idx_group_posts_author_id ON group_posts(author_id);
CREATE INDEX idx_group_posts_created_at ON group_posts(created_at DESC);

CREATE INDEX idx_group_events_group_id ON group_events(group_id);
CREATE INDEX idx_group_events_start_time ON group_events(start_time);
CREATE INDEX idx_group_events_status ON group_events(status);

CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE farming_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Public groups are visible to all
CREATE POLICY "Public groups are viewable" ON farming_groups
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

-- Members can view their groups
CREATE POLICY "Members can view group memberships" ON group_memberships
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM group_memberships gm
    WHERE gm.group_id = group_memberships.group_id AND gm.user_id = auth.uid()
  ));

-- Members can view group posts
CREATE POLICY "Members can view group posts" ON group_posts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM group_memberships gm
    WHERE gm.group_id = group_posts.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.status = 'active'
  ));

-- Members can create posts
CREATE POLICY "Members can create posts" ON group_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = group_posts.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.status = 'active'
    )
  );
```

---

## 📋 FEATURE #3: COMMUNITY IMPACT DASHBOARD 📊

### Overview
Visualize the collective impact of the community with stats, charts, and interactive map.

### Phase 3.1: Analytics System

**File:** `database/create-community-impact-system.sql`

```sql
-- =====================================================
-- COMMUNITY IMPACT TRACKING
-- =====================================================

-- 1. Community Impact Stats (Materialized View for Performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS community_impact_stats AS
SELECT
  -- Member Stats
  (SELECT COUNT(*) FROM users) as total_members,
  (SELECT COUNT(*) FROM users WHERE is_seller = true) as total_sellers,
  (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_members_30d,
  
  -- Product Stats
  (SELECT COUNT(*) FROM vegetables WHERE status != 'deleted') as total_products,
  (SELECT COUNT(DISTINCT user_id) FROM vegetables) as active_sellers,
  (SELECT SUM(CAST(quantity_available AS INTEGER)) FROM vegetables WHERE quantity_unit = 'kg') as total_kg_available,
  
  -- Order Stats
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT SUM(total_amount) FROM orders WHERE status = 'completed') as total_sales,
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '30 days') as orders_30d,
  
  -- Environmental Impact (Estimated)
  (SELECT 
    COALESCE(SUM(
      CASE 
        WHEN o.status = 'completed' THEN 
          -- Estimate: 1kg local produce saves ~2.5kg CO2 vs store-bought
          2.5 * (
            SELECT SUM(oi.quantity)
            FROM order_items oi
            WHERE oi.order_id = o.id
          )
        ELSE 0
      END
    ), 0)
    FROM orders o
  ) as estimated_co2_saved_kg,
  
  -- Community Engagement
  (SELECT COUNT(*) FROM discussions) as total_discussions,
  (SELECT COUNT(*) FROM seed_exchange_requests WHERE status = 'completed') as total_seed_exchanges,
  (SELECT COUNT(*) FROM group_events WHERE status != 'cancelled') as total_events,
  
  -- Geographic Spread
  (SELECT COUNT(DISTINCT location) FROM users WHERE location IS NOT NULL) as unique_locations,
  
  -- Last Updated
  NOW() as last_updated;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_community_impact_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW community_impact_stats;
END;
$$ LANGUAGE plpgsql;

-- 2. Daily Impact Log (Track growth over time)
CREATE TABLE IF NOT EXISTS daily_impact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL UNIQUE,
  
  -- Snapshot of stats
  total_members INTEGER,
  total_products INTEGER,
  total_orders INTEGER,
  total_sales DECIMAL(10, 2),
  co2_saved_kg DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to log daily stats
CREATE OR REPLACE FUNCTION log_daily_impact()
RETURNS void AS $$
BEGIN
  INSERT INTO daily_impact_logs (
    log_date,
    total_members,
    total_products,
    total_orders,
    total_sales,
    co2_saved_kg
  )
  SELECT
    CURRENT_DATE,
    total_members,
    total_products,
    total_orders,
    total_sales,
    estimated_co2_saved_kg
  FROM community_impact_stats
  ON CONFLICT (log_date) DO UPDATE SET
    total_members = EXCLUDED.total_members,
    total_products = EXCLUDED.total_products,
    total_orders = EXCLUDED.total_orders,
    total_sales = EXCLUDED.total_sales,
    co2_saved_kg = EXCLUDED.co2_saved_kg;
END;
$$ LANGUAGE plpgsql;

-- 3. Member Activity Scores
CREATE TABLE IF NOT EXISTS member_activity_scores (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Activity Metrics
  products_listed INTEGER DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  orders_placed INTEGER DEFAULT 0,
  discussions_started INTEGER DEFAULT 0,
  comments_posted INTEGER DEFAULT 0,
  seeds_shared INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  reviews_written INTEGER DEFAULT 0,
  
  -- Computed Score
  total_score INTEGER GENERATED ALWAYS AS (
    products_listed * 5 +
    products_sold * 10 +
    orders_placed * 3 +
    discussions_started * 8 +
    comments_posted * 2 +
    seeds_shared * 15 +
    events_attended * 10 +
    reviews_written * 5
  ) STORED,
  
  -- Ranking
  rank TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (products_listed * 5 + products_sold * 10 + orders_placed * 3 + 
            discussions_started * 8 + comments_posted * 2 + seeds_shared * 15 + 
            events_attended * 10 + reviews_written * 5) >= 1000 THEN 'Community Leader'
      WHEN (products_listed * 5 + products_sold * 10 + orders_placed * 3 + 
            discussions_started * 8 + comments_posted * 2 + seeds_shared * 15 + 
            events_attended * 10 + reviews_written * 5) >= 500 THEN 'Active Contributor'
      WHEN (products_listed * 5 + products_sold * 10 + orders_placed * 3 + 
            discussions_started * 8 + comments_posted * 2 + seeds_shared * 15 + 
            events_attended * 10 + reviews_written * 5) >= 100 THEN 'Growing Member'
      ELSE 'New Member'
    END
  ) STORED,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 IMPLEMENTATION TIMELINE

### Week 1: Seed Exchange Foundation
- **Day 1-2**: Database schema + Run migrations
- **Day 3-4**: Seeds API endpoints
- **Day 5-7**: Basic seed marketplace UI

### Week 2: Seed Exchange Advanced Features
- **Day 8-10**: Exchange request system
- **Day 11-12**: Wishlist feature
- **Day 13-14**: Reviews and ratings

### Week 3: Farming Groups Foundation
- **Day 15-16**: Groups database + Auto-create neighborhood groups
- **Day 17-19**: Groups API + Discovery UI
- **Day 20-21**: Group posts/discussions

### Week 4: Farming Groups Events
- **Day 22-24**: Events system
- **Day 25-26**: RSVP functionality
- **Day 27-28**: Group management features

### Week 5: Impact Dashboard
- **Day 29-30**: Analytics API
- **Day 31-32**: Dashboard UI with charts
- **Day 33-34**: Interactive map
- **Day 35**: Testing & refinement

---

## 📦 NEW COMPONENTS TO CREATE

### Seed Exchange Components
```
src/components/features/seeds/
├── SeedCard.js
├── SeedFilters.js
├── SeedDetailsModal.js
├── SeedExchangeForm.js
├── SeedWishlistManager.js
└── SeedReviewCard.js
```

### Farming Groups Components
```
src/components/features/groups/
├── GroupCard.js
├── GroupDiscovery.js
├── GroupPostsFeed.js
├── CreatePostModal.js
├── EventCard.js
├── EventCalendar.js
└── GroupMembersList.js
```

### Impact Dashboard Components
```
src/components/features/impact/
├── ImpactStatsCards.js
├── ImpactChart.js
├── CommunityMap.js
├── LeaderboardTable.js
└── MilestoneTimeline.js
```

---

## 🎯 SUCCESS METRICS

### Seed Exchange
- **Goal**: 100+ seed listings in first month
- **Goal**: 50+ successful exchanges
- **Goal**: 30% of members participate

### Farming Groups
- **Goal**: Auto-create 10+ neighborhood groups
- **Goal**: 70% member join rate
- **Goal**: 5+ events per month

### Impact Dashboard
- **Goal**: Track 500kg+ produce shared
- **Goal**: Calculate 1000kg+ CO2 saved
- **Goal**: Daily active users increase 40%

---

## 💡 QUICK START CHECKLIST

### Before We Begin
- [ ] Backup current database
- [ ] Review existing schema
- [ ] Set up development environment
- [ ] Create feature branch

### Phase 1 - Seed Exchange
- [ ] Run database migration
- [ ] Test API endpoints
- [ ] Build UI components
- [ ] User acceptance testing

### Phase 2 - Farming Groups
- [ ] Run database migration
- [ ] Implement auto-grouping logic
- [ ] Build group features
- [ ] Test group interactions

### Phase 3 - Impact Dashboard
- [ ] Set up analytics
- [ ] Create visualization components
- [ ] Add interactive elements
- [ ] Performance optimization

---

## 🔧 TECHNICAL CONSIDERATIONS

### Performance
- Use indexes on all foreign keys
- Materialized views for complex stats
- Lazy load images
- Implement pagination (20 items per page)

### Security
- RLS policies on all tables
- Input sanitization
- Image upload validation
- Rate limiting on API endpoints

### Mobile Optimization
- Responsive Bootstrap 5 layouts
- Touch-friendly UI elements
- Optimized images
- Progressive Web App features

---

Ready to start? Let me know which feature you'd like to tackle first! 🚀

