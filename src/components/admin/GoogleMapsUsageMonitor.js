"use client";

import { useState, useEffect } from "react";
import { Card, ProgressBar, Badge, Button, Alert } from "react-bootstrap";
import mapsUsageService from "@/services/GoogleMapsUsageService";

export default function GoogleMapsUsageMonitor() {
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      setStats(mapsUsageService.getUsageStats());
    };

    updateStats();

    // Refresh every 30 seconds
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset the usage counter? This should only be done for testing."
      )
    ) {
      mapsUsageService.resetUsage();
      setRefreshKey((prev) => prev + 1);
    }
  };

  if (!stats) return null;

  const getVariant = () => {
    if (stats.percentage >= 90) return "danger";
    if (stats.percentage >= 75) return "warning";
    return "success";
  };

  const getStatusBadge = () => {
    if (stats.shouldDisable) return <Badge bg="danger">Maps Disabled</Badge>;
    if (stats.isNearLimit) return <Badge bg="warning">Near Limit</Badge>;
    return <Badge bg="success">Active</Badge>;
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <i className="ti-map text-primary" style={{ fontSize: "1.2rem" }}></i>
          <strong>Google Maps API Usage</strong>
          {getStatusBadge()}
        </div>
        <div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleRefresh}
            className="me-2"
            title="Refresh usage data"
          >
            <i className="ti-reload"></i>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleReset}
            title="Reset counter (testing only)"
          >
            <i className="ti-trash"></i>
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {stats.shouldDisable && (
          <Alert variant="danger" className="mb-3">
            <strong>⚠️ Maps Disabled:</strong> Daily usage limit reached (
            {stats.percentage}%). Maps will re-enable tomorrow.
          </Alert>
        )}

        {stats.isNearLimit && !stats.shouldDisable && (
          <Alert variant="warning" className="mb-3">
            <strong>⚠️ Near Limit:</strong> {stats.remaining} requests remaining
            today.
          </Alert>
        )}

        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span>Daily Usage</span>
            <span>
              <strong>{stats.used}</strong> / {stats.limit} requests
            </span>
          </div>
          <ProgressBar
            variant={getVariant()}
            now={stats.percentage}
            label={`${stats.percentage}%`}
          />
        </div>

        <div className="row text-center">
          <div className="col-4">
            <div className="border-end">
              <div className="h4 text-primary mb-0">{stats.used}</div>
              <small className="text-muted">Used Today</small>
            </div>
          </div>
          <div className="col-4">
            <div className="border-end">
              <div className="h4 text-success mb-0">{stats.remaining}</div>
              <small className="text-muted">Remaining</small>
            </div>
          </div>
          <div className="col-4">
            <div className="h4 text-info mb-0">{stats.percentage}%</div>
            <small className="text-muted">Usage</small>
          </div>
        </div>

        <hr />

        <div className="small">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-2">
                <strong className="text-success">
                  <i className="ti-shield me-1"></i>
                  Cost Protection:
                </strong>
              </div>
              <ul className="mb-0 ps-3 text-muted">
                <li>Auto-disable at 90% usage</li>
                <li>Daily quota: {stats.limit} requests</li>
                <li>Counter resets at midnight</li>
              </ul>
            </div>
            <div className="col-md-6">
              <div className="mb-2">
                <strong className="text-info">
                  <i className="ti-credit-card me-1"></i>
                  Cost Estimate:
                </strong>
              </div>
              <div className="text-muted">
                <div>
                  Today:{" "}
                  <strong className="text-dark">
                    ${((stats.used / 1000) * 7).toFixed(2)}
                  </strong>
                </div>
                <div>
                  Monthly:{" "}
                  <strong className="text-dark">
                    ${(((stats.used * 30) / 1000) * 7).toFixed(2)}
                  </strong>
                </div>
                <small className="text-success">
                  <i className="ti-check me-1"></i>
                  Protected from overages
                </small>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
