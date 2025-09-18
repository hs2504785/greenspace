# 🌱 Farm & Garden Visit System - Complete Implementation Guide

## 📋 Overview

The Farm & Garden Visit System allows users to discover local farms, home gardens, terrace gardens, and urban growing spaces. Users can request visits to learn about natural farming practices, while farmers and gardeners can manage their availability, approve/reject requests, and build relationships with their community.

## 🚀 Features

### For Visitors (Users)

- **Browse Farms & Gardens**: Discover farms, home gardens, terrace gardens, and urban growing spaces
- **Filter by Type**: Choose between farm visits (🚜) and garden visits (🌱)
- **Request Visits**: Submit visit requests with preferred dates/times
- **Track Requests**: View status of all visit requests (pending, approved, rejected, completed)
- **Contact Growers**: Direct access to farmer/gardener contact information for approved visits
- **Specify Purpose**: Explain why they want to visit (learning, buying, etc.)

### For Farmers & Gardeners (Sellers)

- **Manage Availability**: Create and edit available time slots for both farm and garden visits
- **Visit Type Control**: Choose between farm visits and garden visits for each slot
- **Set Capacity**: Define maximum visitors per time slot (auto-suggests 5 for farms, 3 for gardens)
- **Location Types**: Specify location (farm, home garden, terrace garden, rooftop garden, community garden)
- **Pricing Control**: Set optional pricing for visits
- **Request Management**: View, approve, reject, and manage visit requests
- **Add Notes**: Provide instructions or notes to visitors
- **Activity Types**: Specify type of visit (farm tour, garden tour, harvesting, workshop, etc.)

### For Administrators

- **Platform Overview**: View all visit requests across the platform
- **Seller Support**: Help sellers manage their availability and requests
- **Quality Control**: Override request statuses when needed
- **System Management**: Access to all farm visit data and analytics

## 🗂️ File Structure

```
src/
├── app/
│   ├── farm-visits/
│   │   ├── page.js                    # Main farm visits page (user-facing)
│   │   └── manage/
│   │       └── page.js                # Management dashboard (seller/admin)
│   ├── my-visits/
│   │   └── page.js                    # User's visit requests
│   └── api/
│       └── farm-visits/
│           ├── requests/
│           │   └── route.js           # Visit request API endpoints
│           ├── availability/
│           │   └── route.js           # Availability management API
│           └── farms/
│               └── route.js           # Farm listing API
├── components/
│   ├── layout/
│   │   └── Header.js                  # Updated with navigation links
│   └── common/
│       └── ProfileDropdown.js        # Updated with management links
database/
├── create_farm_visit_system.sql      # Complete database setup
scripts/
└── setup-farm-visits.js              # Setup instructions script
```

## 🗄️ Database Schema

### Tables Created

#### `farm_visit_availability`

Stores available time slots for each seller with support for both farm and garden visits.

```sql
- id: UUID (Primary Key)
- seller_id: UUID (References users.id)
- date: DATE
- start_time: TIME
- end_time: TIME
- is_available: BOOLEAN
- max_visitors: INTEGER
- current_bookings: INTEGER (auto-managed)
- price_per_person: DECIMAL
- visit_type: VARCHAR (farm, garden)
- location_type: VARCHAR (farm, home_garden, terrace_garden, rooftop_garden, community_garden)
- space_description: TEXT
- activity_type: VARCHAR (farm_tour, garden_tour, harvesting, workshop, etc.)
- special_notes: TEXT
```

#### `farm_visit_requests`

Stores visit requests from users.

```sql
- id: UUID (Primary Key)
- user_id: UUID (References users.id)
- seller_id: UUID (References users.id)
- availability_id: UUID (References farm_visit_availability.id)
- requested_date: DATE
- requested_time_start: TIME
- requested_time_end: TIME
- number_of_visitors: INTEGER
- visitor_name: VARCHAR
- visitor_phone: VARCHAR
- visitor_email: VARCHAR
- purpose: TEXT
- special_requirements: TEXT
- message_to_farmer: TEXT
- status: VARCHAR (pending, approved, rejected, cancelled, completed)
- admin_notes: TEXT
- rejection_reason: TEXT
- reviewed_by: UUID
- reviewed_at: TIMESTAMP
```

#### `farm_visit_reviews` (Future Feature)

Stores reviews for completed visits.

```sql
- id: UUID (Primary Key)
- request_id: UUID (References farm_visit_requests.id)
- user_id: UUID (References users.id)
- seller_id: UUID (References users.id)
- rating: INTEGER (1-5)
- review_text: TEXT
- visit_highlights: TEXT
```

## 🔒 Security & Permissions

### Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

#### Availability Policies

- **Sellers**: Can manage their own availability slots
- **Public**: Can view available slots only
- **Admins**: Can manage all availability slots

#### Request Policies

- **Users**: Can view/create/update their own requests
- **Sellers**: Can view/update requests for their farm
- **Admins**: Can manage all requests

#### Review Policies

- **Public**: Can view all reviews
- **Users**: Can create reviews for their completed visits
- **Users**: Can update their own reviews

## 🔌 API Endpoints

### Visit Requests (`/api/farm-visits/requests`)

- **GET**: Fetch visit requests (filtered by user role)
- **POST**: Create new visit request
- **PUT**: Update request status (approve/reject/cancel)

### Availability Management (`/api/farm-visits/availability`)

- **GET**: Fetch available time slots
- **POST**: Create new availability slot
- **PUT**: Update existing availability slot
- **DELETE**: Remove availability slot

### Farm Listings (`/api/farm-visits/farms`)

- **GET**: List farms accepting visits
- **POST**: Get detailed farm information

## 🎯 User Workflows

### Visitor Workflow

1. Browse available farms at `/farm-visits`
2. Filter by location and availability
3. Select a farm and view available time slots
4. Submit visit request with details
5. Track request status at `/my-visits`
6. Contact farmer when approved
7. Complete visit and leave review (future)

### Farmer Workflow

1. Enable farm visits in profile settings
2. Create availability slots at `/farm-visits/manage`
3. Review incoming visit requests
4. Approve/reject requests with notes
5. Prepare for approved visits
6. Mark visits as completed

### Admin Workflow

1. Monitor all visit requests platform-wide
2. Assist sellers with availability management
3. Handle disputes or issues
4. Generate reports on visit activity

## 📱 User Interface Components

### Main Farm Visits Page (`/farm-visits`)

- **Search & Filters**: Location and availability filters
- **Farm Cards**: Display farm information, ratings, available slots
- **Request Modal**: Form to submit visit request
- **Login Integration**: Seamless authentication flow

### My Visits Page (`/my-visits`)

- **Request Cards**: Show all user's requests with status
- **Detail Modal**: Full request information and actions
- **Status Tracking**: Visual indicators for request progress
- **Contact Information**: Farmer details for approved visits

### Management Dashboard (`/farm-visits/manage`)

- **Tabbed Interface**: Separate tabs for requests and availability
- **Request Management**: Table view with quick actions
- **Availability Calendar**: Create/edit time slots
- **Bulk Operations**: Manage multiple slots efficiently

## ⚙️ Configuration

### Required Environment Variables

```bash
NEXTAUTH_SECRET=your-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Prerequisites

- Existing `users` table with roles (seller, admin, superadmin)
- `seller_farm_profiles` table (created by seller system)
- Row Level Security enabled

## 🚀 Installation & Setup

### Step 1: Database Setup

Run the SQL migration script:

```sql
-- Execute the contents of database/create_farm_visit_system.sql
-- in your Supabase SQL Editor
```

### Step 2: Enable Farm Visits for Sellers

Update existing seller profiles:

```sql
UPDATE seller_farm_profiles
SET visit_booking_enabled = true
WHERE seller_id IN (
  SELECT id FROM users WHERE role = 'seller'
);
```

### Step 3: Navigation Integration

The navigation links are automatically added to:

- Main navigation menu
- User activity section
- Seller/Admin profile dropdown

### Step 4: Test the System

1. Create availability slots as a seller
2. Request a visit as a user
3. Approve/reject requests as a seller
4. Verify all flows work correctly

## 🔧 Advanced Features

### Automatic Booking Management

- **Smart Capacity**: Prevents overbooking automatically
- **Booking Counters**: Real-time tracking of available spots
- **Conflict Prevention**: Prevents double-booking time slots

### Flexible Scheduling

- **Custom Time Slots**: Any start/end time combination
- **Multi-day Availability**: Set availability weeks in advance
- **Activity Types**: Tours, harvesting, workshops, consultations

### Communication Features

- **Visitor Notes**: Purpose and special requirements
- **Farmer Responses**: Approval notes and instructions
- **Contact Integration**: Direct phone/email access

## 📊 Future Enhancements

### Notification System

- **Email Notifications**: Status updates and reminders
- **SMS Alerts**: Critical updates via Twilio
- **Push Notifications**: Real-time updates (PWA)

### Review & Rating System

- **Visit Reviews**: 5-star rating system
- **Photo Sharing**: Visit highlights and photos
- **Farmer Responses**: Reply to visitor reviews

### Analytics & Reporting

- **Visit Metrics**: Track popular farms and time slots
- **Revenue Tracking**: Monitor paid visit income
- **Seasonal Trends**: Analyze visit patterns

### Calendar Integration

- **Google Calendar**: Sync availability with external calendars
- **Outlook Integration**: Enterprise calendar support
- **iCal Export**: Standard calendar format support

### Payment Integration

- **Online Payments**: Secure payment processing
- **Refund Management**: Automated refund processing
- **Revenue Sharing**: Platform commission handling

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### Permission Errors

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'farm_visit_requests';
```

#### Missing Navigation Links

- Clear browser cache
- Restart development server
- Check user authentication status

### Debug Mode

Enable debug logging in development:

```javascript
// In API routes, add:
console.log("Debug info:", { user: session?.user, request: formData });
```

## 📚 Related Documentation

- **Seller System**: `SELLER_VERIFICATION_WORKFLOW_GUIDE.md`
- **User Management**: `MOBILE_AUTH_SETUP.md`
- **Database Schema**: `database/README.md`
- **API Documentation**: Individual route files

## 🤝 Contributing

When extending the farm visit system:

1. **Follow Naming Conventions**: Use consistent naming for variables and functions
2. **Maintain Security**: Always implement proper RLS policies
3. **Update Documentation**: Keep this guide updated with changes
4. **Test Thoroughly**: Verify all user roles and permissions
5. **Consider Performance**: Optimize database queries and UI rendering

## 📞 Support

For questions or issues:

1. Check this documentation first
2. Review the database schema
3. Test with different user roles
4. Contact the development team

---

**Ready to connect farmers and visitors! 🌱👥**
