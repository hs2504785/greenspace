-- =============================================
-- LOCAL FARMING GROUPS SYSTEM
-- =============================================
-- This schema creates a location-based community grouping system
-- where farmers and enthusiasts can connect locally.
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. FARMING GROUPS TABLE
-- =============================================
-- Stores information about local farming groups
CREATE TABLE IF NOT EXISTS farming_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL, -- City/District/Region
  state VARCHAR(100),
  coordinates JSONB, -- {lat, lng}
  cover_image TEXT,
  group_type VARCHAR(50) DEFAULT 'location-based', -- location-based, interest-based, practice-based
  privacy VARCHAR(20) DEFAULT 'public', -- public, private
  max_members INTEGER DEFAULT 0, -- 0 = unlimited
  
  -- Group settings
  auto_approve_members BOOLEAN DEFAULT true,
  allow_member_posts BOOLEAN DEFAULT true,
  allow_events BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Stats (denormalized for performance)
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, archived, suspended
  
  -- Search optimization
  tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, ''))
  ) STORED
);

-- Indexes for farming_groups
CREATE INDEX IF NOT EXISTS idx_farming_groups_location ON farming_groups(location);
CREATE INDEX IF NOT EXISTS idx_farming_groups_state ON farming_groups(state);
CREATE INDEX IF NOT EXISTS idx_farming_groups_status ON farming_groups(status);
CREATE INDEX IF NOT EXISTS idx_farming_groups_created_by ON farming_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_farming_groups_slug ON farming_groups(slug);
CREATE INDEX IF NOT EXISTS idx_farming_groups_tsv ON farming_groups USING GIN(tsv);

-- =============================================
-- 2. GROUP MEMBERSHIPS TABLE
-- =============================================
-- Tracks which users are members of which groups
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES farming_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(50) DEFAULT 'member', -- admin, moderator, member
  
  -- Membership details
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, left, removed, banned
  
  -- Notifications preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  
  -- Activity tracking
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  post_count INTEGER DEFAULT 0,
  
  UNIQUE(group_id, user_id)
);

-- Indexes for group_memberships
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_role ON group_memberships(role);
CREATE INDEX IF NOT EXISTS idx_group_memberships_status ON group_memberships(status);

-- =============================================
-- 3. GROUP POSTS TABLE
-- =============================================
-- Posts/discussions within groups
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES farming_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(255),
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'discussion', -- discussion, announcement, question, tip, photo
  
  -- Media
  images TEXT[], -- Array of image URLs
  attachments JSONB, -- Other attachments
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false, -- No more comments
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  status VARCHAR(20) DEFAULT 'published', -- published, draft, hidden, removed
  
  -- Search optimization
  tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED
);

-- Indexes for group_posts
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_user_id ON group_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON group_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_status ON group_posts(status);
CREATE INDEX IF NOT EXISTS idx_group_posts_tsv ON group_posts USING GIN(tsv);

-- =============================================
-- 4. GROUP POST COMMENTS TABLE
-- =============================================
-- Comments on group posts
CREATE TABLE IF NOT EXISTS group_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES group_post_comments(id) ON DELETE CASCADE, -- For threaded replies
  
  content TEXT NOT NULL,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  status VARCHAR(20) DEFAULT 'published' -- published, hidden, removed
);

-- Indexes for group_post_comments
CREATE INDEX IF NOT EXISTS idx_group_post_comments_post_id ON group_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_user_id ON group_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_parent ON group_post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_created_at ON group_post_comments(created_at DESC);

-- =============================================
-- 5. GROUP EVENTS TABLE
-- =============================================
-- Events organized by groups
CREATE TABLE IF NOT EXISTS group_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES farming_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Event details
  event_type VARCHAR(50) DEFAULT 'meetup', -- meetup, workshop, farm-visit, seed-swap, training
  
  -- Date and time
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_all_day BOOLEAN DEFAULT false,
  
  -- Location
  location_name VARCHAR(255),
  location_address TEXT,
  coordinates JSONB, -- {lat, lng}
  is_online BOOLEAN DEFAULT false,
  online_link TEXT,
  
  -- Capacity
  max_attendees INTEGER DEFAULT 0, -- 0 = unlimited
  attendee_count INTEGER DEFAULT 0,
  
  -- Media
  cover_image TEXT,
  images TEXT[],
  
  -- Settings
  require_approval BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true, -- Visible to non-members
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, ongoing, completed, cancelled
  
  -- Search optimization
  tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED
);

-- Indexes for group_events
CREATE INDEX IF NOT EXISTS idx_group_events_group_id ON group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_created_by ON group_events(created_by);
CREATE INDEX IF NOT EXISTS idx_group_events_start_date ON group_events(start_date);
CREATE INDEX IF NOT EXISTS idx_group_events_status ON group_events(status);
CREATE INDEX IF NOT EXISTS idx_group_events_tsv ON group_events USING GIN(tsv);

-- =============================================
-- 6. EVENT ATTENDEES TABLE
-- =============================================
-- Tracks who is attending which events
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES group_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  rsvp_status VARCHAR(20) DEFAULT 'going', -- going, maybe, not-going, pending
  
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  
  -- Attendee notes
  notes TEXT,
  
  UNIQUE(event_id, user_id)
);

-- Indexes for event_attendees
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_rsvp_status ON event_attendees(rsvp_status);

-- =============================================
-- 7. GROUP LIKES TABLE
-- =============================================
-- Generic likes for posts and comments
CREATE TABLE IF NOT EXISTS group_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Polymorphic relation
  likeable_type VARCHAR(50) NOT NULL, -- 'post' or 'comment'
  likeable_id UUID NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, likeable_type, likeable_id)
);

-- Indexes for group_likes
CREATE INDEX IF NOT EXISTS idx_group_likes_user_id ON group_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_group_likes_likeable ON group_likes(likeable_type, likeable_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_farming_groups_updated_at ON farming_groups;
CREATE TRIGGER update_farming_groups_updated_at BEFORE UPDATE ON farming_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_group_posts_updated_at ON group_posts;
CREATE TRIGGER update_group_posts_updated_at BEFORE UPDATE ON group_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_group_post_comments_updated_at ON group_post_comments;
CREATE TRIGGER update_group_post_comments_updated_at BEFORE UPDATE ON group_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_group_events_updated_at ON group_events;
CREATE TRIGGER update_group_events_updated_at BEFORE UPDATE ON group_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE farming_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE farming_groups SET member_count = member_count - 1 WHERE id = NEW.group_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE farming_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE farming_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_group_member_count_trigger ON group_memberships;
CREATE TRIGGER update_group_member_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON group_memberships
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function to update post count
CREATE OR REPLACE FUNCTION update_group_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE farming_groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE farming_groups SET post_count = post_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_group_post_count_trigger ON group_posts;
CREATE TRIGGER update_group_post_count_trigger
AFTER INSERT OR DELETE ON group_posts
FOR EACH ROW EXECUTE FUNCTION update_group_post_count();

-- Function to update event count
CREATE OR REPLACE FUNCTION update_group_event_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE farming_groups SET event_count = event_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE farming_groups SET event_count = event_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_group_event_count_trigger ON group_events;
CREATE TRIGGER update_group_event_count_trigger
AFTER INSERT OR DELETE ON group_events
FOR EACH ROW EXECUTE FUNCTION update_group_event_count();

-- Function to update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.rsvp_status = 'going' THEN
    UPDATE group_events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.rsvp_status = 'going' AND NEW.rsvp_status != 'going' THEN
      UPDATE group_events SET attendee_count = attendee_count - 1 WHERE id = NEW.event_id;
    ELSIF OLD.rsvp_status != 'going' AND NEW.rsvp_status = 'going' THEN
      UPDATE group_events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.rsvp_status = 'going' THEN
    UPDATE group_events SET attendee_count = attendee_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON event_attendees;
CREATE TRIGGER update_event_attendee_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON event_attendees
FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE farming_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_likes ENABLE ROW LEVEL SECURITY;

-- Farming Groups Policies
CREATE POLICY "Groups are viewable by everyone" ON farming_groups
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can create groups" ON farming_groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group creators and admins can update groups" ON farming_groups
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND status = 'active'
    )
  );

-- Group Memberships Policies
CREATE POLICY "Memberships are viewable by group members" ON group_memberships
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
    )
  );

CREATE POLICY "Users can join groups" ON group_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their memberships" ON group_memberships
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('admin', 'moderator')
      AND gm.status = 'active'
    )
  );

-- Group Posts Policies
CREATE POLICY "Posts are viewable by group members" ON group_posts
  FOR SELECT USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = group_posts.group_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Group members can create posts" ON group_posts
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = group_posts.group_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can update their own posts" ON group_posts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts" ON group_posts
  FOR DELETE USING (user_id = auth.uid());

-- Group Post Comments Policies
CREATE POLICY "Comments are viewable by group members" ON group_post_comments
  FOR SELECT USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN group_memberships gm ON gm.group_id = gp.group_id
      WHERE gp.id = post_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
    )
  );

CREATE POLICY "Group members can create comments" ON group_post_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON group_post_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON group_post_comments
  FOR DELETE USING (user_id = auth.uid());

-- Group Events Policies
CREATE POLICY "Events are viewable by group members" ON group_events
  FOR SELECT USING (
    (is_public = true AND status = 'upcoming') OR
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = group_events.group_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Group members can create events" ON group_events
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_id = group_events.group_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Event creators can update events" ON group_events
  FOR UPDATE USING (created_by = auth.uid());

-- Event Attendees Policies
CREATE POLICY "Attendees are viewable by event participants" ON event_attendees
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_attendees ea
      WHERE ea.event_id = event_id
      AND ea.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can RSVP to events" ON event_attendees
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their RSVP" ON event_attendees
  FOR UPDATE USING (user_id = auth.uid());

-- Group Likes Policies
CREATE POLICY "Users can manage their own likes" ON group_likes
  FOR ALL USING (user_id = auth.uid());

-- =============================================
-- INITIAL SEED DATA
-- =============================================

-- Create some default groups based on common locations
-- (Run this after you have users with locations in the database)

-- Example: Auto-create groups for existing user locations
-- INSERT INTO farming_groups (name, slug, description, location, created_by)
-- SELECT DISTINCT
--   location || ' Farmers Group' as name,
--   LOWER(REPLACE(location, ' ', '-')) || '-farmers' as slug,
--   'Connect with natural farming enthusiasts in ' || location as description,
--   location,
--   (SELECT id FROM users WHERE location = u.location LIMIT 1) as created_by
-- FROM users u
-- WHERE location IS NOT NULL AND location != ''
-- ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- HELPFUL QUERIES
-- =============================================

-- Get groups with member counts:
-- SELECT g.*, COUNT(gm.id) as actual_members
-- FROM farming_groups g
-- LEFT JOIN group_memberships gm ON gm.group_id = g.id AND gm.status = 'active'
-- GROUP BY g.id;

-- Get user's groups:
-- SELECT g.*, gm.role, gm.joined_at
-- FROM farming_groups g
-- JOIN group_memberships gm ON gm.group_id = g.id
-- WHERE gm.user_id = '<user-id>' AND gm.status = 'active';

-- Get nearby groups (requires proper location data):
-- SELECT * FROM farming_groups
-- WHERE location ILIKE '%<city>%'
-- ORDER BY member_count DESC;

-- Get group feed (recent posts):
-- SELECT gp.*, u.name as author_name, u.avatar_url
-- FROM group_posts gp
-- JOIN users u ON u.id = gp.user_id
-- WHERE gp.group_id = '<group-id>' AND gp.status = 'published'
-- ORDER BY gp.created_at DESC;

-- Get upcoming events:
-- SELECT ge.*, fg.name as group_name
-- FROM group_events ge
-- JOIN farming_groups fg ON fg.id = ge.group_id
-- WHERE ge.start_date > NOW()
-- AND ge.status = 'upcoming'
-- ORDER BY ge.start_date ASC;

COMMIT;

