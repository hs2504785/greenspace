import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { createSupabaseClient } from "@/utils/supabaseAuth";

/**
 * Connect user to their Google Sheets products without importing to database
 * POST /api/connect-sheet-products
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Please log in first" },
        { status: 401 }
      );
    }

    const { sheetUrl } = await request.json();
    if (!sheetUrl) {
      return NextResponse.json(
        { error: "Google Sheets URL is required" },
        { status: 400 }
      );
    }

    // Extract spreadsheet ID
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Invalid Google Sheets URL" },
        { status: 400 }
      );
    }

    // Fetch products from sheet
    const products = await fetchProductsFromSheet(spreadsheetId);
    if (!products.length) {
      return NextResponse.json(
        { error: "No products found in sheet" },
        { status: 400 }
      );
    }

    // Filter products for this user
    const userProducts = products.filter(
      (product) =>
        product.seller_email &&
        product.seller_email.toLowerCase() === session.user.email.toLowerCase()
    );

    if (!userProducts.length) {
      return NextResponse.json(
        {
          error: `No products found with your email (${session.user.email}). Please add your email in the "Seller Email" column.`,
          totalInSheet: products.length,
        },
        { status: 400 }
      );
    }

    // Store the connection (not the products) in database
    const supabase = createSupabaseClient();

    // Get or create user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Store sheet connection (replace existing if any)
    const { error: connectionError } = await supabase
      .from("user_sheet_connections")
      .upsert(
        {
          user_id: user.id,
          sheet_id: spreadsheetId,
          sheet_url: sheetUrl,
          user_email: session.user.email,
          connected_at: new Date().toISOString(),
          is_active: true,
        },
        {
          onConflict: "user_id",
        }
      );

    if (connectionError) {
      console.error("Connection error:", connectionError);
      // Continue even if this fails - it's not critical
    }

    return NextResponse.json({
      success: true,
      message: "Sheet connected successfully!",
      userEmail: session.user.email,
      productsFound: userProducts.length,
      totalInSheet: products.length,
      sheetId: spreadsheetId,
      // Return the products for display (but don't store them)
      products: userProducts.map((product) => ({
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        category: product.category,
        unit: product.unit,
        location: product.location,
        organic: product.organic,
        harvest_date: product.harvest_date,
        images: product.images ? [product.images] : [],
        source: "google_sheets",
      })),
    });
  } catch (error) {
    console.error("Connection error:", error);
    return NextResponse.json(
      { error: "Failed to connect to sheet" },
      { status: 500 }
    );
  }
}

function extractSpreadsheetId(url) {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
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

  console.log("CSV Headers found:", headers);

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

    // Log first product for debugging
    if (i === 1) {
      console.log("First product parsed:", product);
      console.log("Values array:", values);
      console.log("Headers to fields mapping:");
      headers.forEach((header, idx) => {
        console.log(
          `  "${header}" -> "${mapHeader(header)}" = "${values[idx]
            ?.replace(/"/g, "")
            .trim()}"`
        );
      });
    }

    // Only add if we have required fields
    if (product.name && product.seller_email && product.price) {
      products.push(product);
    }
  }

  console.log(`Parsed ${products.length} valid products from CSV`);
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
