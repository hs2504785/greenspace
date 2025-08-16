import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  console.log("🔧 Testing Supabase header configuration...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValue: supabaseUrl,
      keyLength: supabaseKey?.length || 0,
      keyPreview: supabaseKey
        ? supabaseKey.substring(0, 20) + "..."
        : "missing",
    },
    tests: {},
  };

  try {
    // Test 1: Create basic Supabase client without custom fetch
    console.log("🧪 Test 1: Basic Supabase client without custom fetch");
    const basicClient = createClient(supabaseUrl, supabaseKey);

    const { data: basicTest, error: basicError } = await basicClient
      .from("users")
      .select("id")
      .limit(1);

    results.tests.basicClient = {
      success: !basicError,
      error: basicError
        ? {
            message: basicError.message,
            hint: basicError.hint,
            code: basicError.code,
          }
        : null,
      dataReceived: !!basicTest,
    };

    // Test 2: Manual fetch with proper headers
    console.log("🧪 Test 2: Manual fetch with proper headers");
    try {
      const manualResponse = await fetch(
        `${supabaseUrl}/rest/v1/users?select=id&limit=1`,
        {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
        }
      );

      const manualText = await manualResponse.text();

      results.tests.manualFetch = {
        success: manualResponse.ok,
        status: manualResponse.status,
        statusText: manualResponse.statusText,
        response: manualText.substring(0, 200),
        headers: Object.fromEntries(manualResponse.headers.entries()),
      };
    } catch (manualError) {
      results.tests.manualFetch = {
        success: false,
        error: manualError.message,
      };
    }

    // Test 3: Verify environment variable format
    console.log("🧪 Test 3: Environment variable validation");
    results.tests.envValidation = {
      urlFormat:
        supabaseUrl?.startsWith("https://") &&
        supabaseUrl?.includes("supabase.co"),
      keyFormat: supabaseKey?.startsWith("eyJ"), // JWT tokens start with eyJ
      urlComplete: !!supabaseUrl && supabaseUrl.length > 30,
      keyComplete: !!supabaseKey && supabaseKey.length > 100,
      expectedUrlPattern: `https://${
        supabaseUrl?.split(".")[0]?.split("//")[1]
      }.supabase.co`,
      actualUrl: supabaseUrl,
    };
  } catch (error) {
    console.error("💥 Test error:", error);
    results.error = {
      message: error.message,
      stack: error.stack,
    };
  }

  console.log("📊 Header test results:", results);
  return Response.json(results);
}
