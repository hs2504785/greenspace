# 🌾 Local Farming Groups - Setup Guide

## Overview
A location-based community grouping system where farmers and enthusiasts can connect locally, share knowledge, organize events, and collaborate.

## Database Setup

### 1. Run the SQL Schema
```bash
# Connect to your Supabase project or local database
psql your_database_url < database/create-farming-groups-system.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor in your Supabase dashboard
2. Copy contents of `database/create-farming-groups-system.sql`
3. Execute the SQL

### 2. Verify Tables Created
The following tables should be created:
- `farming_groups` - Group information
- `group_memberships` - User memberships
- `group_posts` - Discussion posts
- `group_post_comments` - Comments on posts
- `group_events` - Group events/meetups
- `event_attendees` - Event RSVPs
- `group_likes` - Likes for posts/comments

## Features Implemented

### 1. **Group Management**
- ✅ Create and manage farming groups
- ✅ Location-based groups (city/district/region)
- ✅ Public and private groups
- ✅ Auto-approve or manual member approval
- ✅ Group statistics (members, posts, events)

### 2. **Membership System**
- ✅ Join/leave groups
- ✅ Member roles (admin, moderator, member)
- ✅ Activity tracking
- ✅ Notification preferences

### 3. **Discussion & Posts**
- ✅ Create posts (discussion, announcement, question, tip, photo)
- ✅ Threaded comments
- ✅ Like posts and comments
- ✅ Pin important posts
- ✅ Media attachments

### 4. **Events & Calendar**
- ✅ Create group events
- ✅ Event types (meetup, workshop, farm-visit, seed-swap, training)
- ✅ RSVP system
- ✅ Online and offline events
- ✅ Event capacity management
- ✅ Attendee check-in

## API Endpoints to Implement

### Groups
- `GET /api/groups` - List all groups (with filters)
- `GET /api/groups/:id` - Get group details
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Memberships
- `GET /api/groups/:id/members` - List group members
- `POST /api/groups/:id/join` - Join a group
- `POST /api/groups/:id/leave` - Leave a group
- `PUT /api/groups/:id/members/:userId` - Update member role

### Posts & Discussions
- `GET /api/groups/:id/posts` - Get group feed
- `POST /api/groups/:id/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/comments` - Add comment
- `POST /api/posts/:id/like` - Like/unlike post

### Events
- `GET /api/groups/:id/events` - List group events
- `GET /api/events/:id` - Get event details
- `POST /api/groups/:id/events` - Create event
- `PUT /api/events/:id` - Update event
- `POST /api/events/:id/rsvp` - RSVP to event

## UI Pages to Build

### 1. Groups Discovery (`/groups`)
- List all groups
- Search and filter by location
- Group cards with member count, location
- "Create Group" button

### 2. Group Details (`/groups/:slug`)
- Group info header
- Member list
- Discussion feed
- Events calendar
- About section

### 3. Group Management (`/groups/:slug/settings`)
- Edit group details
- Manage members
- Group settings
- Moderation tools

### 4. Create/Edit Group (`/groups/new`, `/groups/:slug/edit`)
- Group form with location selector
- Privacy settings
- Member approval settings

### 5. Events Calendar (`/groups/:slug/events`)
- Calendar view
- List view
- Filter by date/type

### 6. Event Details (`/groups/:slug/events/:id`)
- Event information
- RSVP button
- Attendee list
- Location map

## Auto-Create Groups Script

You can automatically create groups based on existing user locations:

```sql
-- Run this query to auto-create groups for user locations
INSERT INTO farming_groups (name, slug, description, location, created_by, status)
SELECT DISTINCT
  u.location || ' Natural Farmers' as name,
  LOWER(REGEXP_REPLACE(u.location, '[^a-zA-Z0-9]', '-', 'g')) || '-farmers' as slug,
  'Connect with natural farming enthusiasts and local farmers in ' || u.location || 
  '. Share knowledge, seeds, and experiences with your local community.' as description,
  u.location,
  (SELECT id FROM users WHERE location = u.location AND role = 'seller' LIMIT 1) as created_by,
  'active' as status
FROM users u
WHERE u.location IS NOT NULL 
  AND u.location != '' 
  AND LENGTH(u.location) > 3
  AND NOT EXISTS (
    SELECT 1 FROM farming_groups fg 
    WHERE LOWER(fg.location) = LOWER(u.location)
  )
ON CONFLICT (slug) DO NOTHING;
```

## Notification System (Future Enhancement)

Consider implementing notifications for:
- New group join requests (for admins)
- New posts in followed groups
- Event reminders
- Comments on your posts
- @mentions in discussions

## Best Practices

1. **Group Discovery**
   - Use location-based recommendations
   - Show groups with most activity first
   - Suggest groups based on user's location

2. **Content Moderation**
   - Implement reporting system
   - Give admins moderation tools
   - Auto-flag inappropriate content

3. **Engagement**
   - Send weekly digest emails
   - Highlight active members
   - Gamify participation (badges, points)

4. **Privacy**
   - Respect group privacy settings
   - Don't expose private group content
   - Allow members to control notifications

## Next Steps

1. ✅ Create database schema
2. ⏳ Build API endpoints for groups
3. ⏳ Build API endpoints for posts/comments
4. ⏳ Build API endpoints for events
5. ⏳ Create Groups Discovery UI
6. ⏳ Create Group Details page
7. ⏳ Create Events Calendar
8. ⏳ Add real-time updates (optional)

---

**Ready to build the API endpoints?** Let's start with the Groups API!

