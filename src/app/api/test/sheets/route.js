import { NextResponse } from "next/server";

/**
 * Test endpoint to verify Google Sheets access
 * GET /api/test/sheets?sheetId=YOUR_SHEET_ID
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetId =
      searchParams.get("sheetId") ||
      "1ylFr3y8jIVMr1QMFyu81SKDL-HouDaQMHCBRXpGHIU8";

    // Test CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch sheet: ${response.status} ${response.statusText}`
      );
    }

    const csvText = await response.text();
    const lines = csvText.split("\n");

    // Parse first few rows for preview
    const preview = lines.slice(0, 5).map((line) => {
      const values = parseCSVLine(line);
      return values;
    });

    return NextResponse.json({
      success: true,
      sheetId,
      totalRows: lines.length,
      preview,
      headers: preview[0] || [],
      sampleData: preview.slice(1) || [],
      message: "Google Sheets connection successful!",
    });
  } catch (error) {
    console.error("Sheets test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to connect to Google Sheets",
      },
      { status: 500 }
    );
  }
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
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map((val) => val.replace(/"/g, ""));
}
