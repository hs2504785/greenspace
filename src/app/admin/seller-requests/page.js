"use client";

import { Container, Card, Table, Badge, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/utils/supabaseAuth";
import toastService from "@/utils/toastService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuthenticatedAdmin } from "@/hooks/useAuthenticatedAdmin";

export default function SellerRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    isAdmin,
    loading: adminLoading,
    verifyAdminAccess,
  } = useAuthenticatedAdmin();

  const fetchRequests = async () => {
    try {
      // Verify admin access first
      const hasAccess = await verifyAdminAccess();
      if (!hasAccess) {
        setLoading(false);
        return;
      }

      console.log("🔍 Fetching seller requests via API...");

      // Use the API endpoint instead of direct Supabase access
      const response = await fetch("/api/admin/seller-requests", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();


      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toastService.error("Failed to load seller requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      const supabase = createSupabaseClient();

      // Find the request to get user information
      const request = requests.find((r) => r.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      console.log("🔍 Debug - Full request object:", {
        requestId,
        status,
        request: request,
        hasUser: !!request.user,
        userKeys: request.user ? Object.keys(request.user) : "no user object",
        userId: request.user?.id,
        userEmail: request.user?.email,
      });

      if (!request.user?.id) {
        console.error("❌ Missing user information in request:", {
          requestId,
          hasUser: !!request.user,
          user: request.user,
          requestKeys: Object.keys(request),
        });

        // Fallback: Try to get user info directly from user_id field
        let userId = request.user_id; // Check if user_id exists as direct field

        if (!userId) {
          console.error(
            "❌ ORPHANED REQUEST: No user_id field found. Request data:",
            request
          );

          // Handle orphaned request - update status but mark as orphaned
          const { error: requestError } = await supabase
            .from("seller_requests")
            .update({
              status: status,
              verification_level: status,
              review_notes: `${status.toUpperCase()} - Orphaned request (no user account found)`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", requestId);

          if (requestError) {
            console.error("Orphaned request update error:", requestError);
            throw requestError;
          }

          toastService.warning(
            `Request ${status} - ORPHANED (no user account found)`
          );
          fetchRequests();
          return;
        }

        console.log("🔄 Fallback: Using direct user_id field:", userId);

        // Update request status without user role changes (safer for broken references)
        const { error: requestError } = await supabase
          .from("seller_requests")
          .update({
            status,
            verification_level: status,
            review_notes: `${status.toUpperCase()} - User data missing during processing`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        if (requestError) {
          console.error("Request update error:", requestError);
          throw requestError;
        }

        toastService.success(`Request ${status} (user data unavailable)`);
        fetchRequests();
        return; // Exit early since we can't do user role updates
      }

      console.log("✅ Processing request:", {
        requestId,
        status,
        userId: request.user.id,
        userEmail: request.user.email,
      });

      // Update request status
      const { error: requestError } = await supabase
        .from("seller_requests")
        .update({
          status,
          verification_level: status === "approved" ? "basic_verified" : status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (requestError) {
        console.error("Request update error:", requestError);
        throw requestError;
      }

      // If approved, update user role to seller
      if (status === "approved") {
        const { error: userError } = await supabase
          .from("users")
          .update({
            role: "seller",
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.user.id);

        if (userError) {
          console.error("User role update error:", userError);
          throw userError;
        }

        // Award initial verification badge
        const { error: badgeError } = await supabase
          .from("seller_verification_badges")
          .insert({
            seller_id: request.user.id,
            badge_type: "verified_natural",
            badge_name: "Verified Natural Farmer",
            badge_description: "Awarded upon basic verification approval",
            verified_by: null, // Will be set by RLS policy to current user
            verification_notes: "Automatically awarded upon approval",
            active: true,
            earned_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (badgeError) {
          console.warn("Badge creation warning (non-critical):", badgeError);
          // Don't throw error for badge creation failure
        }

        // Update farm profile if exists
        const { error: profileError } = await supabase
          .from("seller_farm_profiles")
          .update({
            profile_verified: true,
            last_verification_date: new Date().toISOString(),
            verification_notes: "Approved via admin panel",
          })
          .eq("seller_id", request.user.id);

        if (profileError) {
          console.warn(
            "Farm profile update warning (non-critical):",
            profileError
          );
          // Don't throw error for profile update failure
        }

        toastService.success(
          `Seller application approved! User ${request.user.email} is now a seller.`
        );
      } else {
        toastService.success(`Request ${status}`);
      }

      fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toastService.error(`Failed to update request: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!adminLoading) {
      fetchRequests();
    }
  }, [adminLoading]);

  if (loading || adminLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Container className="pb-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">
            <i className="ti-user me-2"></i>
            Seller Requests
          </h4>
        </Card.Header>
        <Card.Body>
          {requests.length === 0 ? (
            <div className="text-center pb-4">
              <i className="ti-info-alt text-muted display-4"></i>
              <p className="mt-3 mb-0">No seller requests found</p>
            </div>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Business Details</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={request.user?.avatar_url}
                          alt=""
                          className="rounded-circle me-2"
                          width="32"
                          height="32"
                        />
                        <div>
                          <div>{request.user?.name}</div>
                          <div className="small text-muted">
                            {request.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{request.business_name}</div>
                      <div className="small text-muted">
                        {request.business_description}
                      </div>
                      <div className="small text-muted">
                        <i className="ti-location-pin me-1"></i>
                        {request.location}
                      </div>
                    </td>
                    <td>
                      <div>
                        <i className="ti-mobile me-1"></i>
                        {request.contact_number}
                      </div>
                      {request.whatsapp_number && (
                        <div>
                          <i className="ti-comment me-1"></i>
                          {request.whatsapp_number}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge
                        bg={
                          request.status === "approved"
                            ? "success"
                            : request.status === "rejected"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {request.status}
                      </Badge>
                    </td>
                    <td>
                      {request.status === "pending" && (
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(request.id, "approved")
                            }
                          >
                            <i className="ti-check me-1"></i>
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(request.id, "rejected")
                            }
                          >
                            <i className="ti-close me-1"></i>
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
