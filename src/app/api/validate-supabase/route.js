export async function GET(request) {
  console.log("🔧 Validating Supabase connection step by step...");

  const results = {
    timestamp: new Date().toISOString(),
    steps: {},
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlPattern: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(
            /https:\/\/([^.]+)\..*/,
            "https://$1.supabase.co/..."
          )
        : "missing",
    },
  };

  // Step 1: Test basic URL accessibility
  console.log("🌐 Step 1: Testing basic URL accessibility...");
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      results.steps.urlTest = { success: false, error: "URL not found" };
    } else {
      // Try a simple ping to the base URL
      const response = await fetch(url, {
        method: "HEAD",
        timeout: 5000,
      });

      results.steps.urlTest = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    }
  } catch (error) {
    results.steps.urlTest = {
      success: false,
      error: error.message,
      type: error.constructor.name,
    };
    console.error("❌ URL test failed:", error);
  }

  // Step 2: Test Supabase REST API health endpoint
  console.log("🏥 Step 2: Testing Supabase health endpoint...");
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      timeout: 5000,
    });

    const text = await response.text();
    results.steps.healthTest = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: text.substring(0, 200),
    };
  } catch (error) {
    results.steps.healthTest = {
      success: false,
      error: error.message,
      type: error.constructor.name,
    };
    console.error("❌ Health test failed:", error);
  }

  // Step 3: Test API key validation
  console.log("🔑 Step 3: Testing API key validation...");
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    results.steps.apiKeyTest = {
      success: response.status !== 401 && response.status !== 403,
      status: response.status,
      statusText: response.statusText,
      authError: response.status === 401 || response.status === 403,
    };
  } catch (error) {
    results.steps.apiKeyTest = {
      success: false,
      error: error.message,
      type: error.constructor.name,
    };
    console.error("❌ API key test failed:", error);
  }

  // Step 4: Test table access
  console.log("📋 Step 4: Testing table access...");
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id&limit=1`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    const text = await response.text();
    results.steps.tableTest = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: text.substring(0, 500),
      tableExists: !text.includes('relation "public.users" does not exist'),
    };
  } catch (error) {
    results.steps.tableTest = {
      success: false,
      error: error.message,
      type: error.constructor.name,
    };
    console.error("❌ Table test failed:", error);
  }

  // Summary
  const allStepsSuccessful = Object.values(results.steps).every(
    (step) => step.success
  );
  results.summary = {
    allStepsSuccessful,
    failedSteps: Object.entries(results.steps)
      .filter(([_, step]) => !step.success)
      .map(([name, _]) => name),
  };

  console.log("📊 Validation complete:", results.summary);
  return Response.json(results);
}
