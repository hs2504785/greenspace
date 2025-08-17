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

      const supabase = createSupabaseClient();

      // Optimized query with specific field selection
      const { data, error } = await supabase
        .from("seller_requests")
        .select(
          `
          id,
          business_name,
          business_description,
          location,
          contact_number,
          whatsapp_number,
          status,
          created_at,
          updated_at,
          user:users!user_id(
            id, name, email, avatar_url
          ),
          reviewer:users!reviewed_by(
            id, name
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(50); // Limit for performance

      if (error) throw error;
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

      // Update request status
      const { error: requestError } = await supabase
        .from("seller_requests")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // If approved, update user role to seller
      if (status === "approved") {
        const request = requests.find((r) => r.id === requestId);
        if (!request?.user_id) throw new Error("User not found");

        const { error: userError } = await supabase
          .from("users")
          .update({
            role: "seller",
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.user_id);

        if (userError) throw userError;
      }

      toastService.success(`Request ${status}`);
      fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toastService.error("Failed to update request");
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
