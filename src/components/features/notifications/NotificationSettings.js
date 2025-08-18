"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Alert,
  Badge,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import useNotifications from "@/hooks/useNotifications";
import toastService from "@/utils/toastService";

export default function NotificationSettings() {
  const { data: session } = useSession();
  const {
    isSubscribed,
    permission,
    loading,
    error,
    preferences,
    preferencesLoading,
    isSupported,
    isAuthenticated,
    canSubscribe,
    needsPermission,
    isBlocked,
    isReady,
    subscribe,
    unsubscribe,
    requestPermission,
    updatePreferences,
    togglePreference,
    testNotification,
    clearError,
    getBrowserInfo,
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBrowserInfo, setShowBrowserInfo] = useState(false);

  // Sync local preferences with hook preferences
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  // Clear error after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handlePreferenceChange = (key, value) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const success = await updatePreferences(localPreferences);
      if (success) {
        toastService.success("Notification preferences saved!");
      } else {
        toastService.error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toastService.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toastService.success("Push notifications disabled");
      } else {
        toastService.error("Failed to disable push notifications");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toastService.success("Push notifications enabled!");
      } else {
        toastService.error("Failed to enable push notifications");
      }
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toastService.success("Notification permission granted!");
    } else {
      toastService.error("Notification permission denied");
    }
  };

  const handleTestNotification = () => {
    testNotification();
    toastService.info("Test notification sent!");
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case "granted":
        return <Badge bg="success">Enabled</Badge>;
      case "denied":
        return <Badge bg="danger">Blocked</Badge>;
      case "default":
        return <Badge bg="warning">Not Set</Badge>;
      case "unsupported":
        return <Badge bg="secondary">Unsupported</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (isReady) return "ti-bell";
    if (isBlocked) return "ti-bell-off";
    if (needsPermission) return "ti-bell-ringing";
    return "ti-bell";
  };

  const getStatusColor = () => {
    if (isReady) return "success";
    if (isBlocked) return "danger";
    if (needsPermission) return "warning";
    return "secondary";
  };

  if (!isAuthenticated) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-4">
          <i className="ti ti-lock text-muted" style={{ fontSize: "2rem" }}></i>
          <h6 className="mt-3 mb-2">Login Required</h6>
          <p className="text-muted mb-0">
            Please log in to manage your notification settings.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i
              className={`ti ${getStatusIcon()} text-${getStatusColor()} me-2`}
            ></i>
            Notification Settings
          </h5>
          {process.env.NODE_ENV === "development" && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowBrowserInfo(!showBrowserInfo)}
            >
              <i className="ti ti-info-circle me-1"></i>
              Debug
            </Button>
          )}
        </div>
      </Card.Header>

      <Card.Body>
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            <i className="ti ti-alert-circle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Browser Not Supported */}
        {!isSupported && (
          <Alert variant="warning">
            <i className="ti ti-browser me-2"></i>
            Push notifications are not supported in your browser. Please use a
            modern browser like Chrome, Firefox, or Safari.
          </Alert>
        )}

        {/* Browser Info (Development) */}
        {showBrowserInfo && process.env.NODE_ENV === "development" && (
          <Alert variant="info">
            <strong>Browser Info:</strong>
            <pre className="mt-2 mb-0" style={{ fontSize: "0.8rem" }}>
              {JSON.stringify(getBrowserInfo(), null, 2)}
            </pre>
          </Alert>
        )}

        {/* Push Notification Status */}
        <div className="border rounded p-3 mb-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h6 className="mb-1">Push Notifications</h6>
              <small className="text-muted">
                Get instant notifications about new products and orders
              </small>
              <div className="mt-2">
                <span className="me-2">Status:</span>
                {getPermissionBadge()}
                {isSubscribed && (
                  <Badge bg="success" className="ms-2">
                    Active
                  </Badge>
                )}
              </div>
            </Col>
            <Col md={4} className="text-end">
              {needsPermission ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRequestPermission}
                  disabled={loading || !isSupported}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-bell me-2"></i>
                      Enable
                    </>
                  )}
                </Button>
              ) : isBlocked ? (
                <Alert variant="warning" className="mb-0 p-2">
                  <small>
                    Notifications blocked. Please enable in your browser
                    settings.
                  </small>
                </Alert>
              ) : (
                <div className="d-flex gap-2">
                  <Button
                    variant={isSubscribed ? "outline-danger" : "success"}
                    size="sm"
                    onClick={handlePushToggle}
                    disabled={loading || !isSupported}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {isSubscribed ? "Disabling..." : "Enabling..."}
                      </>
                    ) : (
                      <>
                        <i
                          className={`ti ti-${
                            isSubscribed ? "bell-off" : "bell"
                          } me-2`}
                        ></i>
                        {isSubscribed ? "Disable" : "Enable"}
                      </>
                    )}
                  </Button>
                  {isSubscribed && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleTestNotification}
                    >
                      <i className="ti ti-send me-1"></i>
                      Test
                    </Button>
                  )}
                </div>
              )}
            </Col>
          </Row>
        </div>

        {/* Notification Preferences */}
        {preferencesLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading preferences...
          </div>
        ) : localPreferences && Object.keys(localPreferences).length > 0 ? (
          <>
            <h6 className="mb-3">What would you like to be notified about?</h6>

            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="new_products"
                    label="New Products"
                    checked={localPreferences.new_products || false}
                    onChange={(e) =>
                      handlePreferenceChange("new_products", e.target.checked)
                    }
                  />
                  <small className="text-muted d-block mt-1">
                    When sellers add new products to the marketplace
                  </small>
                </div>

                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="order_updates"
                    label="Order Updates"
                    checked={localPreferences.order_updates || false}
                    onChange={(e) =>
                      handlePreferenceChange("order_updates", e.target.checked)
                    }
                  />
                  <small className="text-muted d-block mt-1">
                    Status updates for your orders
                  </small>
                </div>

                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="seller_messages"
                    label="Seller Messages"
                    checked={localPreferences.seller_messages || false}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "seller_messages",
                        e.target.checked
                      )
                    }
                  />
                  <small className="text-muted d-block mt-1">
                    Direct messages from sellers
                  </small>
                </div>
              </Col>

              <Col md={6}>
                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="price_drops"
                    label="Price Drops"
                    checked={localPreferences.price_drops || false}
                    onChange={(e) =>
                      handlePreferenceChange("price_drops", e.target.checked)
                    }
                  />
                  <small className="text-muted d-block mt-1">
                    When products you're interested in go on sale
                  </small>
                </div>

                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="marketing"
                    label="Marketing & Promotions"
                    checked={localPreferences.marketing || false}
                    onChange={(e) =>
                      handlePreferenceChange("marketing", e.target.checked)
                    }
                  />
                  <small className="text-muted d-block mt-1">
                    Special offers and promotional content
                  </small>
                </div>

                <div className="mb-3">
                  <Form.Check
                    type="switch"
                    id="email_enabled"
                    label="Email Notifications"
                    checked={localPreferences.email_enabled || false}
                    onChange={(e) =>
                      handlePreferenceChange("email_enabled", e.target.checked)
                    }
                  />
                  <small className="text-muted d-block mt-1">
                    Receive notifications via email as well
                  </small>
                </div>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="success"
                onClick={savePreferences}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-2"></i>
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <i
              className="ti ti-settings text-muted"
              style={{ fontSize: "2rem" }}
            ></i>
            <h6 className="mt-3 mb-2">No Preferences Found</h6>
            <p className="text-muted mb-0">
              Your notification preferences will appear here once loaded.
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
