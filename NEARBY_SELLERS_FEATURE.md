# Nearby Sellers Feature Documentation

## Overview

The Nearby Sellers feature allows users to discover local gardeners and farmers selling fresh produce based on geographical location. This feature enhances the marketplace by enabling location-based discovery of sellers and their products.

## Features Implemented

### 🗺️ Core Features

- **Location-based seller discovery** - Find sellers within specified radius
- **Interactive map view** - Visual representation of seller locations
- **Distance sorting** - Sellers sorted by proximity to user
- **Manual location entry** - Search by address or city name
- **Auto location detection** - Use browser geolocation API
- **Seller profiles** - Detailed view of individual sellers with their products
- **Contact integration** - Direct WhatsApp and phone contact with sellers

### 🎯 User Experience

- **Multiple view modes** - Grid, list, and map views
- **Search filters** - Filter by distance, category, price
- **Popular cities** - Quick access to cities with most sellers
- **Responsive design** - Works seamlessly on mobile and desktop
- **Real-time search** - Dynamic location suggestions

## Technical Implementation

### Database Schema Changes

The feature includes the following database modifications:

```sql
-- New columns added to users table for geolocation
ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8);
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN city VARCHAR(100);
ALTER TABLE users ADD COLUMN state VARCHAR(100);
ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT 'India';
ALTER TABLE users ADD COLUMN postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE;

-- New columns added to vegetables table for product-specific locations
ALTER TABLE vegetables ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE vegetables ADD COLUMN longitude DECIMAL(11, 8);
ALTER TABLE vegetables ADD COLUMN address TEXT;
ALTER TABLE vegetables ADD COLUMN city VARCHAR(100);
ALTER TABLE vegetables ADD COLUMN state VARCHAR(100);
ALTER TABLE vegetables ADD COLUMN country VARCHAR(100) DEFAULT 'India';
ALTER TABLE vegetables ADD COLUMN postal_code VARCHAR(20);
```

### Database Functions

Two PostgreSQL functions were created for efficient geolocation queries:

1. **`get_nearby_sellers(lat, lng, radius)`** - Returns sellers within specified radius
2. **`get_nearby_products(lat, lng, radius)`** - Returns products within specified radius
3. **`calculate_distance(lat1, lng1, lat2, lng2)`** - Haversine distance calculation

### API Endpoints

| Endpoint               | Method | Description                                              |
| ---------------------- | ------ | -------------------------------------------------------- |
| `/api/nearby-sellers`  | GET    | Get nearby sellers by coordinates or search by city      |
| `/api/nearby-sellers`  | POST   | Geocode addresses, reverse geocode, update user location |
| `/api/nearby-products` | GET    | Get nearby products with filters                         |
| `/api/sellers/[id]`    | GET    | Get individual seller details with products              |
| `/api/locations`       | GET    | Get popular cities and location suggestions              |
| `/api/locations`       | POST   | Batch geocoding and coordinate validation                |

### Components Architecture

```
src/
├── components/
│   └── features/
│       ├── location/
│       │   └── LocationInput.js      # Location input with autocomplete
│       ├── sellers/
│       │   └── SellerCard.js         # Seller display component
│       └── map/
│           └── SellerMap.js          # Simple map visualization
├── services/
│   └── LocationService.js            # Core location operations
└── app/
    ├── nearby-sellers/
    │   └── page.js                   # Main nearby sellers page
    └── sellers/
        └── [id]/
            └── page.js               # Individual seller page
```

## Setup Instructions

### 1. Database Migration

Run the geolocation support migration:

```bash
# Apply the database migration
psql -d your_database -f src/db/migrations/add_geolocation_support.sql
```

### 2. Environment Setup

No additional environment variables are required. The feature uses:

- **Nominatim (OpenStreetMap)** for geocoding (free service)
- **Browser Geolocation API** for current location
- **PostgreSQL PostGIS** functions for distance calculations

### 3. Navigation Integration

The feature is already integrated into the main navigation as "Nearby Farmers".

## Usage Guide

### For Users

1. **Access the Feature**

   - Click "Nearby Farmers" in the main navigation
   - Or visit `/nearby-sellers` directly

2. **Find Nearby Sellers**

   - Allow location access for automatic detection
   - Or manually enter your address/city
   - Adjust search radius (5km to 100km)

3. **View Sellers**

   - **Grid View**: Card-based layout
   - **List View**: Compact list format
   - **Map View**: Visual map with seller markers

4. **Contact Sellers**
   - Click WhatsApp button for instant messaging
   - Click Call button for phone contact
   - Click "View Products" to see seller's available items

### For Sellers

1. **Update Location**

   - Sellers need to update their profile with precise location
   - Location can be set via the profile page or admin panel

2. **Add Products with Location**
   - Products can have specific locations (farm, market, etc.)
   - This allows for more precise location-based discovery

## Technical Features

### Location Services

```javascript
// Get user's current location
const location = await LocationService.getCurrentPosition();

// Geocode an address
const coords = await LocationService.geocodeAddress("New Delhi, India");

// Find nearby sellers
const sellers = await LocationService.getNearbySellers(lat, lng, 50);

// Calculate distance between two points
const distance = LocationService.calculateDistance(lat1, lng1, lat2, lng2);
```

### Search Capabilities

- **Radius-based search**: 5km to 100km radius
- **City/state search**: Find sellers in specific cities
- **Text search**: Search by seller name or location
- **Category filtering**: Filter products by category
- **Price filtering**: Filter by price range
- **Organic filtering**: Show only organic products

## Performance Optimizations

### Database Indexes

```sql
-- Geolocation indexes for fast spatial queries
CREATE INDEX idx_users_coordinates ON users (latitude, longitude);
CREATE INDEX idx_users_role_location ON users (role, latitude, longitude)
  WHERE role = 'seller';
CREATE INDEX idx_vegetables_coordinates ON vegetables (latitude, longitude);
```

### Caching

- **Geocoding cache**: Prevents repeated API calls for same addresses
- **Location suggestions**: Cached popular cities and locations
- **Browser location**: Cached for 5 minutes

## Future Enhancements

### Immediate Improvements

1. **Google Maps Integration**

   - Replace simple map with Google Maps or Mapbox
   - Add route planning and directions
   - Satellite view and street view

2. **Advanced Filters**

   - Delivery options (pickup, delivery, both)
   - Operating hours and availability
   - Seller ratings and reviews

3. **Real-time Features**
   - Live inventory updates
   - Real-time seller availability
   - Push notifications for nearby new sellers

### Long-term Features

1. **Geofencing**

   - Notify users when they enter areas with active sellers
   - Location-based promotions and offers

2. **Route Optimization**

   - Plan optimal routes for visiting multiple sellers
   - Bulk order optimization

3. **Community Features**
   - Seller meetups and farmers markets
   - Local food events and harvest festivals

## API Examples

### Get Nearby Sellers

```javascript
// Get sellers within 25km of coordinates
const response = await fetch(
  "/api/nearby-sellers?latitude=28.6139&longitude=77.2090&radius=25"
);
const data = await response.json();
```

### Search by City

```javascript
// Search sellers in a specific city
const response = await fetch("/api/nearby-sellers?city=Mumbai");
const data = await response.json();
```

### Geocode Address

```javascript
// Convert address to coordinates
const response = await fetch("/api/nearby-sellers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "geocode",
    address: "Connaught Place, New Delhi",
  }),
});
```

## Troubleshooting

### Common Issues

1. **Location not detected**

   - Ensure HTTPS connection for geolocation API
   - Check browser permissions for location access
   - Fallback to manual location entry

2. **No sellers found**

   - Increase search radius
   - Check if sellers have updated their locations
   - Try searching in different cities

3. **Geocoding errors**
   - Verify internet connection
   - Check if Nominatim service is accessible
   - Use more specific addresses

### Error Handling

The feature includes comprehensive error handling for:

- Network connectivity issues
- Geolocation permission denied
- Invalid coordinates
- Geocoding service unavailability
- Database connectivity problems

## Contributing

To contribute to the nearby sellers feature:

1. Review the existing code structure
2. Follow the established patterns for API endpoints
3. Ensure responsive design for all components
4. Add appropriate error handling and loading states
5. Update this documentation for any new features

## License

This feature is part of the Greenspace marketplace and follows the same licensing terms as the main project.
