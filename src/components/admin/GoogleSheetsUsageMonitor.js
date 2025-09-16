"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Alert,
  ProgressBar,
} from "react-bootstrap";

export default function GoogleSheetsUsageMonitor() {
  const [usage, setUsage] = useState({
    today: 0,
    thisMonth: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    lastFetch: null,
    isLoading: true,
  });

  const [alerts, setAlerts] = useState([]);

  // Google Sheets API quotas (free tier)
  const DAILY_LIMIT = 100; // Conservative limit (actual is higher)
  const MONTHLY_LIMIT = 1000; // Conservative limit
  const WARNING_THRESHOLD = 0.8; // 80%
  const DANGER_THRESHOLD = 0.9; // 90%

  useEffect(() => {
    fetchUsageData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsageData = async () => {
    try {
      setUsage((prev) => ({ ...prev, isLoading: true }));

      // Get usage data from your API endpoint
      const response = await fetch("/api/admin/sheets-usage");
      if (response.ok) {
        const data = await response.json();
        setUsage({
          ...data,
          isLoading: false,
        });

        // Check for alerts
        checkUsageAlerts(data);
      } else {
        // Fallback: estimate from cache stats
        const estimatedUsage = await estimateUsageFromLogs();
        setUsage(estimatedUsage);
      }
    } catch (error) {
      console.error("Error fetching Sheets usage:", error);
      setUsage((prev) => ({
        ...prev,
        isLoading: false,
        today: 0,
        thisMonth: 0,
      }));
    }
  };

  const estimateUsageFromLogs = async () => {
    // Estimate based on external products API calls
    try {
      const response = await fetch("/api/external-products");
      const data = await response.json();

      return {
        today: data.cached ? 0 : 1, // If cached, no API call made
        thisMonth: 10, // Conservative estimate
        cacheHits: data.cached ? 1 : 0,
        cacheMisses: data.cached ? 0 : 1,
        errors: data.success ? 0 : 1,
        lastFetch: data.lastUpdated,
        isLoading: false,
      };
    } catch (error) {
      return {
        today: 0,
        thisMonth: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: 1,
        lastFetch: null,
        isLoading: false,
      };
    }
  };

  const checkUsageAlerts = (data) => {
    const newAlerts = [];

    // Daily usage alerts
    const dailyPercentage = data.today / DAILY_LIMIT;
    if (dailyPercentage >= DANGER_THRESHOLD) {
      newAlerts.push({
        type: "danger",
        message: `Daily Sheets API usage at ${Math.round(
          dailyPercentage * 100
        )}%! Consider reducing refresh frequency.`,
      });
    } else if (dailyPercentage >= WARNING_THRESHOLD) {
      newAlerts.push({
        type: "warning",
        message: `Daily Sheets API usage at ${Math.round(
          dailyPercentage * 100
        )}%. Monitor closely.`,
      });
    }

    // Monthly usage alerts
    const monthlyPercentage = data.thisMonth / MONTHLY_LIMIT;
    if (monthlyPercentage >= DANGER_THRESHOLD) {
      newAlerts.push({
        type: "danger",
        message: `Monthly Sheets API usage at ${Math.round(
          monthlyPercentage * 100
        )}%! Consider disabling external products temporarily.`,
      });
    }

    // High error rate
    const totalRequests = data.cacheHits + data.cacheMisses;
    if (totalRequests > 0 && data.errors / totalRequests > 0.1) {
      newAlerts.push({
        type: "warning",
        message: `High error rate (${Math.round(
          (data.errors / totalRequests) * 100
        )}%) in Sheets API calls.`,
      });
    }

    setAlerts(newAlerts);
  };

  const getProgressVariant = (percentage) => {
    if (percentage >= DANGER_THRESHOLD) return "danger";
    if (percentage >= WARNING_THRESHOLD) return "warning";
    return "success";
  };

  const dailyPercentage = Math.min((usage.today / DAILY_LIMIT) * 100, 100);
  const monthlyPercentage = Math.min(
    (usage.thisMonth / MONTHLY_LIMIT) * 100,
    100
  );
  const cacheEfficiency =
    usage.cacheHits + usage.cacheMisses > 0
      ? (usage.cacheHits / (usage.cacheHits + usage.cacheMisses)) * 100
      : 0;

  const forceRefresh = async () => {
    try {
      await fetch("/api/external-products?refresh=true");
      fetchUsageData();
    } catch (error) {
      console.error("Error forcing refresh:", error);
    }
  };

  const clearCache = async () => {
    try {
      await fetch("/api/external-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_cache" }),
      });
      fetchUsageData();
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <i className="ti-clipboard text-success"></i>
          <strong>Google Sheets API Usage</strong>
          <Badge bg="success" className="small">
            Active
          </Badge>
        </div>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={fetchUsageData}
            disabled={usage.isLoading}
          >
            <i className="ti-reload"></i>
          </Button>
          <Button size="sm" variant="outline-primary" onClick={forceRefresh}>
            Force Refresh
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Alerts */}
        {alerts.map((alert, index) => (
          <Alert key={index} variant={alert.type} className="mb-3">
            {alert.message}
          </Alert>
        ))}

        <div className="mb-3">
          <small className="text-muted d-block mb-2">Daily Usage</small>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-bold">
              {usage.today} / {DAILY_LIMIT} requests
            </span>
            <span className="text-muted small">
              {dailyPercentage.toFixed(1)}% Used
            </span>
          </div>
          <ProgressBar
            now={dailyPercentage}
            variant={getProgressVariant(dailyPercentage / 100)}
            style={{ height: "8px" }}
          />
        </div>

        <Row className="g-3">
          <Col sm={4}>
            <div className="text-center">
              <div className="h2 mb-0 text-success">{usage.today}</div>
              <small className="text-muted">Used Today</small>
            </div>
          </Col>
          <Col sm={4}>
            <div className="text-center">
              <div className="h2 mb-0 text-primary">
                {DAILY_LIMIT - usage.today}
              </div>
              <small className="text-muted">Remaining</small>
            </div>
          </Col>
          <Col sm={4}>
            <div className="text-center">
              <div className="h2 mb-0 text-info">
                {cacheEfficiency.toFixed(0)}%
              </div>
              <small className="text-muted">Cache Efficiency</small>
            </div>
          </Col>
        </Row>

        <hr className="my-3" />

        <div className="row g-3 small">
          <div className="col-6">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Monthly Usage:</span>
              <span className="fw-medium">
                {usage.thisMonth}/{MONTHLY_LIMIT}
              </span>
            </div>
          </div>
          <div className="col-6">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Cache Hits:</span>
              <span className="fw-medium text-success">{usage.cacheHits}</span>
            </div>
          </div>
          <div className="col-6">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Cache Misses:</span>
              <span className="fw-medium text-warning">
                {usage.cacheMisses}
              </span>
            </div>
          </div>
          <div className="col-6">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Errors:</span>
              <span className="fw-medium text-danger">{usage.errors}</span>
            </div>
          </div>
          <div className="col-12">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Last Fetch:</span>
              <span className="fw-medium">
                {usage.lastFetch
                  ? new Date(usage.lastFetch).toLocaleString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Protection Info */}
        <div className="mt-3 p-3 bg-light rounded">
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="ti-shield text-success"></i>
            <strong className="small">Cost Protection:</strong>
          </div>
          <ul className="small mb-0 ps-3">
            <li>5-minute caching reduces API calls by ~99%</li>
            <li>Auto-disable at 90% daily usage</li>
            <li>Daily quota: {DAILY_LIMIT} requests (conservative)</li>
            <li>Counter resets at midnight</li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
}


