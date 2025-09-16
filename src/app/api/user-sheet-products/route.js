import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { createSupabaseClient } from "@/utils/supabaseAuth";

/**
 * Get products from all connected user sheets
 * GET /api/user-sheet-products
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Please log in first" },
        { status: 401 }
      );
    }

    const supabase = createSupabaseClient();

    // Get all user sheet connections
    const { data: connections, error: connectionsError } = await supabase
      .from("user_sheet_connections")
      .select("sheet_id, sheet_url, user_email")
      .eq("is_active", true);

    if (connectionsError) {
      console.error("Error fetching sheet connections:", connectionsError);
      return NextResponse.json(
        { error: "Failed to fetch sheet connections" },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        totalProducts: 0,
        sheetsConnected: 0,
      });
    }

    // Fetch products from all connected sheets
    const allProducts = [];
    let successfulSheets = 0;

    for (const connection of connections) {
      try {
        const products = await fetchProductsFromSheet(connection.sheet_id);

        // Filter products for the specific user (owner of this sheet connection)
        const userProducts = products.filter(
          (product) =>
            product.seller_email &&
            product.seller_email.toLowerCase() ===
              connection.user_email.toLowerCase()
        );

        // Add sheet metadata to each product
        const enrichedProducts = userProducts.map((product) => ({
          ...product,
          id: `user_sheet_${connection.sheet_id}_${product.id}`, // Unique ID
          source_sheet_id: connection.sheet_id,
          source_sheet_url: connection.sheet_url,
          owner_email: connection.user_email,
          source_type: "user_connected_sheet",
          is_external: true, // Mark as external for stats calculation
          data_source: "user_connected_sheet",
        }));

        allProducts.push(...enrichedProducts);
        successfulSheets++;
      } catch (error) {
        console.error(
          `Error fetching from sheet ${connection.sheet_id}:`,
          error
        );
        // Continue with other sheets even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      products: allProducts,
      totalProducts: allProducts.length,
      sheetsConnected: connections.length,
      successfulSheets,
    });
  } catch (error) {
    console.error("Error fetching user sheet products:", error);
    return NextResponse.json(
      { error: "Failed to fetch user sheet products" },
      { status: 500 }
    );
  }
}

async function fetchProductsFromSheet(spreadsheetId) {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    throw new Error(`Sheet access failed: ${error.message}`);
  }
}

function parseCSV(csvText) {
  const lines = csvText.split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const product = {};

    headers.forEach((header, index) => {
      const value = values[index]?.replace(/"/g, "").trim();
      if (value) {
        const field = mapHeader(header);
        if (field) {
          product[field] = value;
        }
      }
    });

    // Only add if we have required fields
    if (product.name && product.seller_email && product.price) {
      // Generate unique ID for this product
      const productId = `${btoa(product.name + product.seller_email).replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}_${i}`;

      product.id = productId;
      product.price = parseFloat(product.price) || 0;
      product.quantity = parseFloat(product.quantity) || 0;
      product.available = product.quantity > 0;
      product.created_at = new Date().toISOString();
      product.updated_at = new Date().toISOString();

      // Ensure images is an array (VegetableCard expects this)
      if (product.images) {
        if (typeof product.images === "string") {
          // Split comma-separated URLs and clean them
          product.images = product.images
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url.length > 0);
        }
      } else {
        product.images = [];
      }

      products.push(product);
    }
  }

  return products;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function mapHeader(header) {
  const normalizedHeader = header.toLowerCase().trim();

  const mapping = {
    // Primary mappings based on exact column names
    "seller email": "seller_email",
    name: "name",
    description: "description",
    price: "price",
    quantity: "quantity",
    category: "category",
    unit: "unit",
    location: "location",
    images: "images",
    "contact name": "contact_name",
    "contact phone": "contact_phone",
    "contact whatsapp": "contact_whatsapp",
    organic: "organic",
    "harvest date": "harvest_date",
    notes: "notes",

    // Alternative mappings
    email: "seller_email",
    "product name": "name",
    desc: "description",
    cost: "price",
    rate: "price",
    qty: "quantity",
    stock: "quantity",
    type: "category",
    measure: "unit",
    place: "location",
    address: "location",
    image: "images",
    photo: "images",
    natural: "organic",
    harvested: "harvest_date",
    picked: "harvest_date",
  };

  return mapping[normalizedHeader] || null;
}
