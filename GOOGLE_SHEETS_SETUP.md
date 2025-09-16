# Google Sheets Integration Setup

This guide explains how to set up Google Sheets integration for external sellers to list their products.

## Overview

The Google Sheets integration allows external sellers to list their products without requiring user registration or direct database access. Sellers simply create a Google Sheet with their products, and the system automatically fetches and displays them alongside internal products.

## Architecture

```
External Sellers → Google Sheets → Our API → Display on Website
```

### Benefits

- **Scalability**: No database limits - external data comes from Google Sheets
- **No Registration**: Sellers don't need accounts
- **Self-Service**: Sellers manage their own inventory
- **Free Hosting**: Leverages Google's infrastructure
- **Real-time Updates**: Changes appear within minutes

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key and add it to your environment variables:
   ```
   GOOGLE_SHEETS_API_KEY=your_api_key_here
   ```

### 3. Create Template Spreadsheet

1. Create a new Google Sheet
2. Set up the following columns in the first row:

| Column           | Required | Example                     | Description                |
| ---------------- | -------- | --------------------------- | -------------------------- |
| Name             | ✅       | Fresh Tomatoes              | Product name               |
| Description      | ⭕       | Organic red tomatoes        | Product description        |
| Price            | ✅       | 50                          | Price in ₹                 |
| Quantity         | ✅       | 10                          | Available quantity         |
| Category         | ✅       | Vegetables                  | Product category           |
| Unit             | ⭕       | kg                          | Unit of measurement        |
| Location         | ⭕       | Hyderabad                   | Seller location            |
| Images           | ⭕       | https://example.com/img.jpg | Comma-separated image URLs |
| Contact Name     | ✅       | Ramesh Kumar                | Seller name                |
| Contact Phone    | ⭕       | 9876543210                  | Phone number               |
| Contact WhatsApp | ⭕       | 9876543210                  | WhatsApp number            |
| Organic          | ⭕       | Yes                         | Yes/No                     |
| Harvest Date     | ⭕       | 2025-09-15                  | Harvest date               |
| Notes            | ⭕       | Available for pickup only   | Additional notes           |

3. Make the sheet publicly viewable:

   - Click "Share" → "Anyone with the link can view"
   - Copy the share URL

4. Extract the spreadsheet ID from the URL:

   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
   ```

5. Add the spreadsheet ID to your environment variables:
   ```
   PUBLIC_SELLERS_SHEET_ID=your_spreadsheet_id_here
   ```

### 4. Test the Integration

1. Start your development server
2. Go to `/api/external-products?validate=true&spreadsheetId=YOUR_SHEET_ID`
3. Check if the validation passes

## Usage

### For Sellers

1. Copy the template spreadsheet
2. Add their products following the format
3. Make sure the sheet is publicly viewable
4. Products will appear on the website within 5 minutes

### For Administrators

1. Monitor the validation endpoint: `/api/external-products?validate=true`
2. Refresh external data: `/api/external-products?refresh=true`
3. Check stats in the enhanced vegetable service

## API Endpoints

### GET `/api/external-products`

- Fetches products from Google Sheets
- Includes 5-minute caching
- Query parameters:
  - `refresh=true`: Force refresh cache
  - `validate=true`: Validate sheet structure
  - `spreadsheetId=ID`: Use specific sheet ID

### POST `/api/external-products`

- Actions: `validate`, `refresh_cache`
- Body: `{ "action": "validate", "spreadsheetId": "..." }`

## Services

### GoogleSheetsService

- Handles Google Sheets API communication
- Parses product data from rows
- Validates sheet structure
- Located: `src/services/GoogleSheetsService.js`

### EnhancedVegetableService

- Combines internal and external products
- Manages caching for external data
- Provides unified search and filtering
- Located: `src/services/EnhancedVegetableService.js`

## Hooks

### useEnhancedVegetables

- React hook for managing combined product data
- Includes filtering, sorting, and external data refresh
- Located: `src/hooks/useEnhancedVegetables.js`

## Error Handling

Common errors and solutions:

1. **403 Forbidden**: Sheet isn't publicly accessible
2. **404 Not Found**: Invalid spreadsheet ID
3. **400 Bad Request**: Invalid range or format
4. **Rate Limiting**: Implement caching (already included)

## Security Considerations

1. **API Key Security**: Restrict API key to your domain
2. **Data Validation**: All external data is sanitized
3. **Rate Limiting**: 5-minute cache prevents API abuse
4. **Public Access**: Sheets must be publicly readable

## Monitoring

Monitor these metrics:

- External product fetch success rate
- Cache hit/miss ratio
- Sheet validation errors
- Product data quality

## Future Enhancements

Possible improvements:

- Multiple sheet support
- Webhook integration for real-time updates
- Seller analytics dashboard
- Product approval workflow
- Image hosting integration

## Troubleshooting

### Common Issues

1. **No products showing**:

   - Check if `GOOGLE_SHEETS_API_KEY` is set
   - Verify sheet is publicly accessible
   - Check console logs for API errors

2. **Validation fails**:

   - Ensure headers match exactly
   - Check required fields are present
   - Verify sheet permissions

3. **Cache not updating**:
   - Use `refresh=true` parameter
   - Check cache timestamp in API response
   - Restart server if needed

### Debug Mode

Enable debug logging by setting:

```
NODE_ENV=development
```

This will show detailed logs for:

- Sheet parsing
- Product validation
- Cache operations
- API requests
