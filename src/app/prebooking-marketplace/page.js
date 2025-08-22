"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
} from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import { usePreBookingMarketplace } from "@/hooks/usePreBookingMarketplace";
import PreBookingFilters from "@/components/features/PreBooking/PreBookingFilters";
import PreBookingResults from "@/components/features/PreBooking/PreBookingResults";
import EmptyState from "@/components/common/EmptyState";

export default function PreBookingMarketplacePage() {
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const {
    products,
    loading,
    error,
    totalCount,
    filters,
    updateFilters,
    refresh,
  } = usePreBookingMarketplace();

  // Listen for global filter toggle from header
  useEffect(() => {
    const handleFilterToggle = () => {
      setShowFilters(true);
    };

    window.addEventListener("toggle-prebooking-filters", handleFilterToggle);
    return () => {
      window.removeEventListener(
        "toggle-prebooking-filters",
        handleFilterToggle
      );
    };
  }, []);

  return (
    <>
      {/* Compact Styling */}
      <style jsx>{`
        .container {
          max-width: 1200px;
        }
        .row {
          margin-bottom: 0;
        }
        .page-background {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
      `}</style>

      <div className="page-background">
        {/* Hero Section */}
        <div
          className="bg-light border-bottom"
          style={{
            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
            marginTop: "-1.5rem",
          }}
        >
          <Container className="py-3">
            <div className="text-center">
              <h1 className="h4 fw-bold mb-2 text-dark">
                🌱 Secure Your Future Harvest
              </h1>
              <p className="mb-2 text-muted small">
                Pre-book fresh, organic vegetables directly from farmers. Get
                guaranteed produce at fair prices.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3 small text-muted">
                <div className="d-flex align-items-center">
                  <i className="ti-calendar me-1 text-success"></i>
                  <span>Plan Ahead</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="ti-shield me-1 text-success"></i>
                  <span>Guaranteed Quality</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="ti-heart me-1 text-success"></i>
                  <span>Support Farmers</span>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Main Content */}
        <div className="bg-white">
          <Container className="pt-4 pb-3">
            {/* Active Filters Summary */}
            {(filters.category !== "all" ||
              filters.harvest_season !== "all" ||
              filters.search) && (
              <div className="mb-3">
                <div className="bg-light rounded p-2 small">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <small className="text-muted fw-medium">
                        Active Filters:
                      </small>
                      {filters.search && (
                        <Badge
                          bg="primary"
                          className="d-flex align-items-center gap-1"
                        >
                          Search: "{filters.search}"
                          <button
                            className="btn-close btn-close-white"
                            style={{ fontSize: "0.6rem" }}
                            onClick={() => updateFilters({ search: "" })}
                          ></button>
                        </Badge>
                      )}
                      {filters.category !== "all" && (
                        <Badge
                          bg="success"
                          className="d-flex align-items-center gap-1"
                        >
                          {filters.category}
                          <button
                            className="btn-close btn-close-white"
                            style={{ fontSize: "0.6rem" }}
                            onClick={() => updateFilters({ category: "all" })}
                          ></button>
                        </Badge>
                      )}
                      {filters.harvest_season !== "all" && (
                        <Badge
                          bg="info"
                          className="d-flex align-items-center gap-1"
                        >
                          {filters.harvest_season}
                          <button
                            className="btn-close btn-close-white"
                            style={{ fontSize: "0.6rem" }}
                            onClick={() =>
                              updateFilters({ harvest_season: "all" })
                            }
                          ></button>
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-decoration-none p-0"
                      onClick={() =>
                        updateFilters({
                          search: "",
                          category: "all",
                          harvest_season: "all",
                        })
                      }
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            <PreBookingResults
              products={products}
              loading={loading}
              error={error}
            />
          </Container>
        </div>

        {/* Filter Offcanvas */}
        <PreBookingFilters
          show={showFilters}
          onHide={() => setShowFilters(false)}
          filters={filters}
          onFilterChange={updateFilters}
          totalCount={totalCount}
        />
      </div>
    </>
  );
}
