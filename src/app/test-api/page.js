"use client";

import { useState } from "react";
import { Button, Container, Card, Badge } from "react-bootstrap";

/**
 * Simple API Test Page
 * Tests farm visit APIs directly from the browser
 */
export default function TestAPIPage() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint, name) => {
    try {
      setResults((prev) => ({ ...prev, [name]: { status: "testing..." } }));

      const response = await fetch(endpoint);
      const data = await response.json();

      setResults((prev) => ({
        ...prev,
        [name]: {
          status: response.ok ? "✅ Success" : "❌ Error",
          statusCode: response.status,
          data: response.ok ? "API working!" : data.error || "Unknown error",
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [name]: {
          status: "❌ Failed",
          statusCode: "Network Error",
          data: error.message,
        },
      }));
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});

    const tests = [
      { endpoint: "/api/debug-requests", name: "Debug Requests API" },
      { endpoint: "/api/debug-availability", name: "Debug Availability API" },
      { endpoint: "/api/farm-visits/requests", name: "Visit Requests API" },
      { endpoint: "/api/farm-visits/availability", name: "Availability API" },
      { endpoint: "/api/farm-visits/farms", name: "Farms API" },
    ];

    for (const test of tests) {
      await testAPI(test.endpoint, test.name);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay
    }

    setLoading(false);
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h3 className="mb-0">🧪 Farm Visit API Test</h3>
          <p className="mb-0 text-muted">
            Test if the farm visit APIs are working after database setup
          </p>
        </Card.Header>
        <Card.Body>
          <Button
            variant="primary"
            onClick={runAllTests}
            disabled={loading}
            className="mb-4"
          >
            {loading ? "Testing APIs..." : "🚀 Run API Tests"}
          </Button>

          {Object.keys(results).length > 0 && (
            <div>
              <h5>Test Results:</h5>
              {Object.entries(results).map(([name, result]) => (
                <Card key={name} className="mb-2">
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>{name}</strong>
                      <Badge
                        bg={result.status.includes("✅") ? "success" : "danger"}
                      >
                        {result.statusCode}
                      </Badge>
                    </div>
                    <div className="text-muted small">
                      {result.status} - {result.data}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          <hr />
          <div className="text-muted small">
            <strong>Expected Results:</strong>
            <ul className="mb-0">
              <li>✅ 200 - If database tables exist and are accessible</li>
              <li>
                ❌ 500 - If database tables are missing or connection failed
              </li>
              <li>❌ 403 - If authentication/permissions issues</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
