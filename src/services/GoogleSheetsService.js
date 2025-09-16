import { google } from "googleapis";

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.initialized = false;
  }

  /**
   * Initialize Google Sheets API with service account credentials
   * For public read-only access, we'll use API key authentication
   */
  async initialize() {
    try {
      // For public read-only sheets, we can use API key authentication
      this.auth = process.env.GOOGLE_SHEETS_API_KEY;
      this.sheets = google.sheets({ version: "v4", auth: this.auth });
      this.initialized = true;
      console.log("✅ Google Sheets service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Google Sheets service:", error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Parse product data from Google Sheets row
   * Expected columns: Name, Description, Price, Quantity, Category, Unit, Location, Images, Contact Name, Contact Phone, Contact WhatsApp, Organic, Harvest Date, Notes
   */
  parseProductRow(row, rowIndex) {
    try {
      // Skip header row and empty rows
      if (rowIndex === 0 || !row || row.length === 0 || !row[0]) {
        return null;
      }

      const [
        sellerEmail = "", // NEW: Column A - Seller Email
        name, // Column B - Name
        description = "", // Column C - Description
        price = "0", // Column D - Price
        quantity = "0", // Column E - Quantity
        category = "Vegetables", // Column F - Category
        unit = "kg", // Column G - Unit
        location = "", // Column H - Location
        images = "", // Column I - Images
        contactName = "", // Column J - Contact Name
        contactPhone = "", // Column K - Contact Phone
        contactWhatsApp = "", // Column L - Contact WhatsApp
        organic = "false", // Column M - Organic
        harvestDate = "", // Column N - Harvest Date
        notes = "", // Column O - Notes
      ] = row;

      // Validate required fields
      if (!name || !name.trim()) {
        console.warn(`⚠️ Skipping row ${rowIndex + 1}: Missing product name`);
        return null;
      }

      // Parse and validate price
      const parsedPrice = parseFloat(price) || 0;
      if (parsedPrice < 0) {
        console.warn(
          `⚠️ Row ${rowIndex + 1}: Invalid price ${price}, setting to 0`
        );
      }

      // Parse and validate quantity
      const parsedQuantity = parseFloat(quantity) || 0;
      if (parsedQuantity < 0) {
        console.warn(
          `⚠️ Row ${rowIndex + 1}: Invalid quantity ${quantity}, setting to 0`
        );
      }

      // Parse images (comma-separated URLs)
      const imageUrls = images
        ? images
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url)
        : [];

      // Generate unique ID for external products (using name + contact as identifier)
      const externalId = `sheets_${btoa(name + contactName + location).replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}_${rowIndex}`;

      return {
        id: externalId,
        name: name.trim(),
        description: description.trim(),
        price: Math.max(0, parsedPrice),
        quantity: Math.max(0, parsedQuantity),
        category: category.trim() || "Vegetables",
        unit: unit.trim() || "kg",
        location: location.trim(),
        images: imageUrls,
        source_type: "external_seller",
        organic:
          organic.toLowerCase() === "true" || organic.toLowerCase() === "yes",
        harvest_date: harvestDate.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        available: parsedQuantity > 0,

        // External seller contact info (stored differently from internal users)
        external_seller: {
          email: sellerEmail.trim(), // NEW: Include seller email
          name: contactName.trim(),
          phone: contactPhone.trim(),
          whatsapp_number: contactWhatsApp.trim(),
          location: location.trim(),
        },

        // Additional metadata for external products
        product_type: "regular",
        estimated_available_date: null,
        harvest_season: null,
        notes: notes.trim() || null,

        // Mark as external for UI differentiation
        is_external: true,
        data_source: "google_sheets",
      };
    } catch (error) {
      console.error(`❌ Error parsing row ${rowIndex + 1}:`, error);
      return null;
    }
  }

  /**
   * Fetch products from a public Google Sheet
   * @param {string} spreadsheetId - The Google Sheets ID
   * @param {string} range - The range to read (e.g., 'Products!A:N')
   * @returns {Promise<Array>} Array of parsed products
   */
  async fetchProductsFromSheet(spreadsheetId, range = "A:O") {
    try {
      await this.ensureInitialized();

      console.log(`📊 Fetching products from Google Sheet: ${spreadsheetId}`);
      console.log(`📍 Range: ${range}`);

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      // Track API usage for cost monitoring
      try {
        await fetch("/api/admin/sheets-usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "increment_usage" }),
        });
      } catch (trackingError) {
        console.warn("Failed to track API usage:", trackingError);
      }

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log("📝 No data found in Google Sheet");
        return [];
      }

      console.log(`📋 Found ${rows.length} rows in Google Sheet`);

      // Parse each row into product data
      const products = [];
      for (let i = 0; i < rows.length; i++) {
        const product = this.parseProductRow(rows[i], i);
        if (product) {
          products.push(product);
        }
      }

      console.log(
        `✅ Successfully parsed ${products.length} products from Google Sheet`
      );
      return products;
    } catch (error) {
      console.error("❌ Error fetching products from Google Sheet:", error);

      // Check for specific error types
      if (error.code === 404) {
        throw new Error(
          "Google Sheet not found. Please check the spreadsheet ID and make sure it's publicly accessible."
        );
      } else if (error.code === 403) {
        throw new Error(
          "Access denied to Google Sheet. Please make sure the sheet is publicly viewable."
        );
      } else if (error.code === 400) {
        throw new Error("Invalid range specified for Google Sheet.");
      }

      throw new Error(
        `Failed to fetch products from Google Sheet: ${error.message}`
      );
    }
  }

  /**
   * Validate Google Sheets data structure
   * @param {string} spreadsheetId - The Google Sheets ID
   * @returns {Promise<Object>} Validation result with structure info
   */
  async validateSheetStructure(spreadsheetId) {
    try {
      await this.ensureInitialized();

      // Get the header row first
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "1:1",
      });

      // Track API usage for cost monitoring
      try {
        await fetch("/api/admin/sheets-usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "increment_usage" }),
        });
      } catch (trackingError) {
        console.warn("Failed to track API usage:", trackingError);
      }

      const headers = response.data.values?.[0] || [];

      const expectedHeaders = [
        "Name",
        "Description",
        "Price",
        "Quantity",
        "Category",
        "Unit",
        "Location",
        "Images",
        "Contact Name",
        "Contact Phone",
        "Contact WhatsApp",
        "Organic",
        "Harvest Date",
        "Notes",
      ];

      const validation = {
        isValid: true,
        headers,
        expectedHeaders,
        missingHeaders: [],
        extraHeaders: [],
        suggestions: [],
      };

      // Check for missing required headers
      const requiredHeaders = [
        "Name",
        "Price",
        "Quantity",
        "Category",
        "Contact Name",
      ];
      validation.missingHeaders = requiredHeaders.filter(
        (header) =>
          !headers.some(
            (h) => h && h.toLowerCase().includes(header.toLowerCase())
          )
      );

      // Check for extra headers
      validation.extraHeaders = headers.filter(
        (header) =>
          header &&
          !expectedHeaders.some(
            (expected) => expected.toLowerCase() === header.toLowerCase()
          )
      );

      if (validation.missingHeaders.length > 0) {
        validation.isValid = false;
        validation.suggestions.push(
          `Missing required columns: ${validation.missingHeaders.join(", ")}`
        );
      }

      if (headers.length === 0) {
        validation.isValid = false;
        validation.suggestions.push(
          "No headers found. Please add column headers in the first row."
        );
      }

      return validation;
    } catch (error) {
      console.error("❌ Error validating sheet structure:", error);
      return {
        isValid: false,
        error: error.message,
        suggestions: [
          "Unable to access the Google Sheet. Please check the spreadsheet ID and permissions.",
        ],
      };
    }
  }

  /**
   * Get sheet metadata (title, etc.)
   */
  async getSheetMetadata(spreadsheetId) {
    try {
      await this.ensureInitialized();

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map((sheet) => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          gridProperties: sheet.properties.gridProperties,
        })),
      };
    } catch (error) {
      console.error("❌ Error getting sheet metadata:", error);
      throw error;
    }
  }
}

export default new GoogleSheetsService();
