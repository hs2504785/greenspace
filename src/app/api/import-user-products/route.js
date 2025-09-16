import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { createSupabaseClient } from "@/utils/supabaseAuth";

/**
 * Import products from Google Sheets with user connection
 * POST /api/import-user-products
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

    // Get or create user in database
    const supabase = createSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
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

    // Filter products for this user (based on seller_email)
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

    // Import products to database
    const imported = [];
    const errors = [];

    for (const product of userProducts) {
      try {
        const productData = {
          name: product.name,
          description: product.description || "",
          price: parseFloat(product.price) || 0,
          quantity: parseInt(product.quantity) || 0,
          category: product.category || "vegetables",
          unit: product.unit || "kg",
          location: product.location || "",
          owner_id: user.id,
          source_type: "google_sheets",
          organic: product.organic === "Yes" || product.organic === true,
          harvest_date: product.harvest_date
            ? new Date(product.harvest_date).toISOString().split("T")[0]
            : null,
          images: product.images ? [product.images] : [],
          available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Basic validation
        if (!productData.name || productData.price <= 0) {
          errors.push(
            `Skipped ${
              product.name || "unnamed product"
            }: Missing name or invalid price`
          );
          continue;
        }

        const { data, error } = await supabase
          .from("vegetables")
          .insert([productData])
          .select()
          .single();

        if (error) {
          errors.push(`Failed to import ${product.name}: ${error.message}`);
        } else {
          imported.push(data);
        }
      } catch (err) {
        errors.push(`Error processing ${product.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      total: userProducts.length,
      userEmail: session.user.email,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import products" },
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

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/"/g, "").toLowerCase());
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const product = {};

    headers.forEach((header, index) => {
      const value = values[index]?.replace(/"/g, "").trim();
      if (value) {
        // Map headers to product fields
        const field = mapHeader(header);
        if (field) {
          product[field] = value;
        }
      }
    });

    if (product.name && product.seller_email) {
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
  const mapping = {
    "seller email": "seller_email",
    email: "seller_email",
    name: "name",
    "product name": "name",
    description: "description",
    price: "price",
    quantity: "quantity",
    category: "category",
    unit: "unit",
    location: "location",
    images: "images",
    organic: "organic",
    "harvest date": "harvest_date",
  };
  return mapping[header] || null;
}
