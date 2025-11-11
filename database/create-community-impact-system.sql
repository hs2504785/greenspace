-- =============================================
-- COMMUNITY IMPACT & CARBON CREDIT SYSTEM
-- =============================================
-- Purpose: Track member environmental impact and carbon credits
-- Features: Carbon credit scoring, activity tracking, impact metrics
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USER IMPACT PROFILES TABLE
-- =============================================
-- Stores carbon credit and impact data for each user
CREATE TABLE IF NOT EXISTS user_impact_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Carbon Credits & Environmental Impact
  carbon_credits_earned DECIMAL(10, 2) DEFAULT 0, -- in kg CO2 equivalent
  trees_planted INTEGER DEFAULT 0,
  organic_waste_composted_kg DECIMAL(10, 2) DEFAULT 0,
  water_saved_liters DECIMAL(10, 2) DEFAULT 0,
  plastic_reduced_kg DECIMAL(10, 2) DEFAULT 0,
  local_food_purchased_kg DECIMAL(10, 2) DEFAULT 0,
  
  -- Activity Metrics
  products_sold INTEGER DEFAULT 0,
  products_purchased INTEGER DEFAULT 0,
  seeds_shared INTEGER DEFAULT 0,
  seeds_received INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  events_organized INTEGER DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  helpful_comments INTEGER DEFAULT 0,
  farm_visits_hosted INTEGER DEFAULT 0,
  farm_visits_attended INTEGER DEFAULT 0,
  
  -- Knowledge Sharing
  guides_written INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  workshops_conducted INTEGER DEFAULT 0,
  
  -- Community Contributions
  volunteer_hours DECIMAL(6, 2) DEFAULT 0,
  donations_made DECIMAL(10, 2) DEFAULT 0,
  members_referred INTEGER DEFAULT 0,
  
  -- Computed Total Impact Score (weighted sum)
  total_impact_score INTEGER GENERATED ALWAYS AS (
    -- Environmental impact (highest weight)
    FLOOR(carbon_credits_earned * 10) +
    (trees_planted * 50) +
    FLOOR(organic_waste_composted_kg * 2) +
    FLOOR(water_saved_liters * 0.1) +
    FLOOR(plastic_reduced_kg * 20) +
    FLOOR(local_food_purchased_kg * 3) +
    
    -- Activity metrics (medium weight)
    (products_sold * 15) +
    (products_purchased * 5) +
    (seeds_shared * 25) +
    (seeds_received * 10) +
    (events_attended * 20) +
    (events_organized * 50) +
    (posts_created * 10) +
    (helpful_comments * 5) +
    (farm_visits_hosted * 30) +
    (farm_visits_attended * 15) +
    
    -- Knowledge sharing (high weight)
    (guides_written * 100) +
    (questions_answered * 15) +
    (workshops_conducted * 75) +
    
    -- Community contributions (medium-high weight)
    FLOOR(volunteer_hours * 20) +
    FLOOR(donations_made * 0.5) +
    (members_referred * 40)
  ) STORED,
  
  -- Impact Level Badge
  impact_level VARCHAR(50) GENERATED ALWAYS AS (
    CASE
      WHEN (
        FLOOR(carbon_credits_earned * 10) +
        (trees_planted * 50) +
        FLOOR(organic_waste_composted_kg * 2) +
        FLOOR(water_saved_liters * 0.1) +
        FLOOR(plastic_reduced_kg * 20) +
        FLOOR(local_food_purchased_kg * 3) +
        (products_sold * 15) +
        (products_purchased * 5) +
        (seeds_shared * 25) +
        (seeds_received * 10) +
        (events_attended * 20) +
        (events_organized * 50) +
        (posts_created * 10) +
        (helpful_comments * 5) +
        (farm_visits_hosted * 30) +
        (farm_visits_attended * 15) +
        (guides_written * 100) +
        (questions_answered * 15) +
        (workshops_conducted * 75) +
        FLOOR(volunteer_hours * 20) +
        FLOOR(donations_made * 0.5) +
        (members_referred * 40)
      ) >= 10000 THEN 'Environmental Champion'
      WHEN (
        FLOOR(carbon_credits_earned * 10) +
        (trees_planted * 50) +
        FLOOR(organic_waste_composted_kg * 2) +
        FLOOR(water_saved_liters * 0.1) +
        FLOOR(plastic_reduced_kg * 20) +
        FLOOR(local_food_purchased_kg * 3) +
        (products_sold * 15) +
        (products_purchased * 5) +
        (seeds_shared * 25) +
        (seeds_received * 10) +
        (events_attended * 20) +
        (events_organized * 50) +
        (posts_created * 10) +
        (helpful_comments * 5) +
        (farm_visits_hosted * 30) +
        (farm_visits_attended * 15) +
        (guides_written * 100) +
        (questions_answered * 15) +
        (workshops_conducted * 75) +
        FLOOR(volunteer_hours * 20) +
        FLOOR(donations_made * 0.5) +
        (members_referred * 40)
      ) >= 5000 THEN 'Sustainability Leader'
      WHEN (
        FLOOR(carbon_credits_earned * 10) +
        (trees_planted * 50) +
        FLOOR(organic_waste_composted_kg * 2) +
        FLOOR(water_saved_liters * 0.1) +
        FLOOR(plastic_reduced_kg * 20) +
        FLOOR(local_food_purchased_kg * 3) +
        (products_sold * 15) +
        (products_purchased * 5) +
        (seeds_shared * 25) +
        (seeds_received * 10) +
        (events_attended * 20) +
        (events_organized * 50) +
        (posts_created * 10) +
        (helpful_comments * 5) +
        (farm_visits_hosted * 30) +
        (farm_visits_attended * 15) +
        (guides_written * 100) +
        (questions_answered * 15) +
        (workshops_conducted * 75) +
        FLOOR(volunteer_hours * 20) +
        FLOOR(donations_made * 0.5) +
        (members_referred * 40)
      ) >= 2000 THEN 'Green Warrior'
      WHEN (
        FLOOR(carbon_credits_earned * 10) +
        (trees_planted * 50) +
        FLOOR(organic_waste_composted_kg * 2) +
        FLOOR(water_saved_liters * 0.1) +
        FLOOR(plastic_reduced_kg * 20) +
        FLOOR(local_food_purchased_kg * 3) +
        (products_sold * 15) +
        (products_purchased * 5) +
        (seeds_shared * 25) +
        (seeds_received * 10) +
        (events_attended * 20) +
        (events_organized * 50) +
        (posts_created * 10) +
        (helpful_comments * 5) +
        (farm_visits_hosted * 30) +
        (farm_visits_attended * 15) +
        (guides_written * 100) +
        (questions_answered * 15) +
        (workshops_conducted * 75) +
        FLOOR(volunteer_hours * 20) +
        FLOOR(donations_made * 0.5) +
        (members_referred * 40)
      ) >= 500 THEN 'Eco Contributor'
      ELSE 'Green Starter'
    END
  ) STORED,
  
  -- Ranking position (updated by function)
  rank_position INTEGER DEFAULT 0,
  
  -- Badges earned
  badges JSONB DEFAULT '[]'::jsonb,
  
  -- Achievements unlocked
  achievements JSONB DEFAULT '[]'::jsonb,
  
  -- Monthly stats (for tracking progress)
  current_month_impact INTEGER DEFAULT 0,
  last_month_impact INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_impact_profiles
CREATE INDEX IF NOT EXISTS idx_user_impact_user_id ON user_impact_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_impact_score ON user_impact_profiles(total_impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_impact_carbon ON user_impact_profiles(carbon_credits_earned DESC);
CREATE INDEX IF NOT EXISTS idx_user_impact_level ON user_impact_profiles(impact_level);

-- =============================================
-- 2. IMPACT ACTIVITIES LOG TABLE
-- =============================================
-- Logs individual impact activities for transparency
CREATE TABLE IF NOT EXISTS impact_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  activity_type VARCHAR(100) NOT NULL, -- 'product_sold', 'seed_shared', 'tree_planted', etc.
  activity_category VARCHAR(50) NOT NULL, -- 'environmental', 'community', 'commerce', 'knowledge'
  
  -- Activity details
  description TEXT,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit VARCHAR(50), -- 'kg', 'liters', 'items', 'hours'
  
  -- Impact metrics
  carbon_credits_earned DECIMAL(10, 2) DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  
  -- Reference to related entities
  reference_type VARCHAR(50), -- 'order', 'seed_exchange', 'event', 'post', etc.
  reference_id UUID,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for impact_activities
CREATE INDEX IF NOT EXISTS idx_impact_activities_user_id ON impact_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_activities_type ON impact_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_impact_activities_category ON impact_activities(activity_category);
CREATE INDEX IF NOT EXISTS idx_impact_activities_created ON impact_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impact_activities_reference ON impact_activities(reference_type, reference_id);

-- =============================================
-- 3. COMMUNITY IMPACT STATISTICS VIEW
-- =============================================
-- Aggregated community-wide impact statistics
CREATE OR REPLACE VIEW community_impact_stats AS
SELECT
  -- Total members
  COUNT(DISTINCT uip.user_id) as total_active_members,
  
  -- Environmental Impact
  SUM(uip.carbon_credits_earned)::decimal(12,2) as total_carbon_credits,
  SUM(uip.trees_planted)::integer as total_trees_planted,
  SUM(uip.organic_waste_composted_kg)::decimal(12,2) as total_waste_composted,
  SUM(uip.water_saved_liters)::decimal(12,2) as total_water_saved,
  SUM(uip.plastic_reduced_kg)::decimal(12,2) as total_plastic_reduced,
  SUM(uip.local_food_purchased_kg)::decimal(12,2) as total_local_food,
  
  -- Community Activity
  SUM(uip.products_sold)::integer as total_products_sold,
  SUM(uip.seeds_shared)::integer as total_seeds_shared,
  SUM(uip.events_organized)::integer as total_events_organized,
  SUM(uip.volunteer_hours)::decimal(10,2) as total_volunteer_hours,
  
  -- Knowledge Sharing
  SUM(uip.guides_written)::integer as total_guides,
  SUM(uip.workshops_conducted)::integer as total_workshops,
  
  -- Impact Levels
  COUNT(CASE WHEN uip.impact_level = 'Environmental Champion' THEN 1 END)::integer as champions_count,
  COUNT(CASE WHEN uip.impact_level = 'Sustainability Leader' THEN 1 END)::integer as leaders_count,
  COUNT(CASE WHEN uip.impact_level = 'Green Warrior' THEN 1 END)::integer as warriors_count,
  COUNT(CASE WHEN uip.impact_level = 'Eco Contributor' THEN 1 END)::integer as contributors_count,
  COUNT(CASE WHEN uip.impact_level = 'Green Starter' THEN 1 END)::integer as starters_count,
  
  NOW() as last_updated
FROM user_impact_profiles uip
WHERE uip.total_impact_score > 0;

-- =============================================
-- 4. MONTHLY IMPACT LEADERBOARD VIEW
-- =============================================
CREATE OR REPLACE VIEW monthly_impact_leaderboard AS
SELECT
  ia.user_id,
  u.name,
  u.avatar_url,
  u.location,
  u.role,
  COUNT(ia.id)::integer as activities_count,
  SUM(ia.carbon_credits_earned)::decimal(10,2) as monthly_carbon_credits,
  SUM(ia.points_earned)::integer as monthly_points,
  ARRAY_AGG(DISTINCT ia.activity_category) as categories,
  MAX(ia.created_at) as last_activity_at
FROM impact_activities ia
JOIN users u ON ia.user_id = u.id
WHERE ia.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY ia.user_id, u.name, u.avatar_url, u.location, u.role
ORDER BY monthly_points DESC
LIMIT 100;

-- =============================================
-- 5. TOP CONTRIBUTORS VIEW
-- =============================================
CREATE OR REPLACE VIEW top_impact_contributors AS
SELECT
  uip.user_id,
  u.name,
  u.avatar_url,
  u.location,
  u.role,
  uip.carbon_credits_earned,
  uip.total_impact_score,
  uip.impact_level,
  uip.trees_planted,
  uip.products_sold,
  uip.seeds_shared,
  uip.events_organized,
  uip.volunteer_hours,
  ROW_NUMBER() OVER (ORDER BY uip.total_impact_score DESC) as rank
FROM user_impact_profiles uip
JOIN users u ON uip.user_id = u.id
WHERE uip.total_impact_score > 0
ORDER BY uip.total_impact_score DESC
LIMIT 100;

-- =============================================
-- 6. FUNCTIONS FOR IMPACT TRACKING
-- =============================================

-- Function to initialize user impact profile
CREATE OR REPLACE FUNCTION initialize_user_impact_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_impact_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create impact profile for new users
DROP TRIGGER IF EXISTS trigger_create_impact_profile ON users;
CREATE TRIGGER trigger_create_impact_profile
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_impact_profile();

-- Function to log impact activity
CREATE OR REPLACE FUNCTION log_impact_activity(
  p_user_id UUID,
  p_activity_type VARCHAR,
  p_category VARCHAR,
  p_description TEXT,
  p_quantity DECIMAL DEFAULT 1,
  p_unit VARCHAR DEFAULT 'items',
  p_carbon_credits DECIMAL DEFAULT 0,
  p_points INTEGER DEFAULT 0,
  p_reference_type VARCHAR DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  -- Insert activity log
  INSERT INTO impact_activities (
    user_id, activity_type, activity_category, description,
    quantity, unit, carbon_credits_earned, points_earned,
    reference_type, reference_id
  ) VALUES (
    p_user_id, p_activity_type, p_category, p_description,
    p_quantity, p_unit, p_carbon_credits, p_points,
    p_reference_type, p_reference_id
  )
  RETURNING id INTO v_activity_id;
  
  -- Update user impact profile based on activity type
  UPDATE user_impact_profiles
  SET
    carbon_credits_earned = carbon_credits_earned + p_carbon_credits,
    current_month_impact = current_month_impact + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update product-related impacts
CREATE OR REPLACE FUNCTION update_product_sale_impact()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
  v_carbon_saved DECIMAL;
  v_points INTEGER;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get seller ID
    SELECT user_id INTO v_seller_id FROM vegetables WHERE id = NEW.vegetable_id;
    
    -- Calculate carbon credits (estimate: 2.5kg CO2 saved per kg of local produce)
    v_carbon_saved := (NEW.quantity * 2.5);
    v_points := (NEW.quantity * 15)::integer;
    
    -- Update seller impact
    UPDATE user_impact_profiles
    SET
      products_sold = products_sold + 1,
      local_food_purchased_kg = local_food_purchased_kg + NEW.quantity,
      carbon_credits_earned = carbon_credits_earned + v_carbon_saved,
      updated_at = NOW()
    WHERE user_id = v_seller_id;
    
    -- Update buyer impact
    UPDATE user_impact_profiles
    SET
      products_purchased = products_purchased + 1,
      local_food_purchased_kg = local_food_purchased_kg + NEW.quantity,
      carbon_credits_earned = carbon_credits_earned + (v_carbon_saved * 0.5),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Log seller activity
    PERFORM log_impact_activity(
      v_seller_id,
      'product_sold',
      'commerce',
      'Sold ' || NEW.quantity::text || 'kg of local produce',
      NEW.quantity,
      'kg',
      v_carbon_saved,
      v_points,
      'order',
      NEW.id
    );
    
    -- Log buyer activity
    PERFORM log_impact_activity(
      NEW.user_id,
      'product_purchased',
      'environmental',
      'Purchased ' || NEW.quantity::text || 'kg of local produce',
      NEW.quantity,
      'kg',
      v_carbon_saved * 0.5,
      (v_points * 0.3)::integer,
      'order',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order completion (if orders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    DROP TRIGGER IF EXISTS trigger_update_sale_impact ON orders;
    CREATE TRIGGER trigger_update_sale_impact
      AFTER INSERT OR UPDATE OF status ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_product_sale_impact();
  END IF;
END $$;

-- Function to update seed exchange impacts
CREATE OR REPLACE FUNCTION update_seed_exchange_impact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update provider impact
    UPDATE user_impact_profiles
    SET
      seeds_shared = seeds_shared + 1,
      updated_at = NOW()
    WHERE user_id = NEW.provider_id;
    
    -- Update requester impact
    UPDATE user_impact_profiles
    SET
      seeds_received = seeds_received + 1,
      updated_at = NOW()
    WHERE user_id = NEW.requester_id;
    
    -- Log activities
    PERFORM log_impact_activity(
      NEW.provider_id,
      'seed_shared',
      'community',
      'Shared seeds: ' || NEW.seed_name,
      1,
      'exchange',
      2,
      25,
      'seed_exchange',
      NEW.id
    );
    
    PERFORM log_impact_activity(
      NEW.requester_id,
      'seed_received',
      'community',
      'Received seeds: ' || NEW.seed_name,
      1,
      'exchange',
      1,
      10,
      'seed_exchange',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for seed exchanges (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seed_exchange_requests') THEN
    DROP TRIGGER IF EXISTS trigger_update_seed_impact ON seed_exchange_requests;
    CREATE TRIGGER trigger_update_seed_impact
      AFTER INSERT OR UPDATE OF status ON seed_exchange_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_seed_exchange_impact();
  END IF;
END $$;

-- Function to update rankings
CREATE OR REPLACE FUNCTION update_impact_rankings()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_impact_score DESC) as new_rank
    FROM user_impact_profiles
    WHERE total_impact_score > 0
  )
  UPDATE user_impact_profiles uip
  SET rank_position = ru.new_rank
  FROM ranked_users ru
  WHERE uip.user_id = ru.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly stats (call at start of each month)
CREATE OR REPLACE FUNCTION reset_monthly_impact_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_impact_profiles
  SET
    last_month_impact = current_month_impact,
    current_month_impact = 0,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on tables
ALTER TABLE user_impact_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_activities ENABLE ROW LEVEL SECURITY;

-- Policies for user_impact_profiles
CREATE POLICY "Anyone can view impact profiles"
  ON user_impact_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can update own impact profile"
  ON user_impact_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for impact_activities
CREATE POLICY "Anyone can view impact activities"
  ON impact_activities FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert own activities"
  ON impact_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 8. INITIALIZE EXISTING USERS
-- =============================================
-- Create impact profiles for existing users
INSERT INTO user_impact_profiles (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Run update_impact_rankings() periodically to update ranks
-- Run reset_monthly_impact_stats() at the start of each month

