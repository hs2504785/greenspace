"use client";

import { Card } from "react-bootstrap";

export default function InfoNotice({
  variant = "info",
  title,
  children,
  icon,
  className = "",
}) {
  const getVariantConfig = (variant) => {
    const configs = {
      info: {
        borderColor: "#0dcaf0",
        backgroundColor: "#f0fcff",
        iconColor: "#0dcaf0",
        titleColor: "#0a58ca",
        defaultIcon: "ti-info-alt",
      },
      success: {
        borderColor: "#198754",
        backgroundColor: "#f0fff4",
        iconColor: "#198754",
        titleColor: "#0f5132",
        defaultIcon: "ti-check",
      },
      warning: {
        borderColor: "#ffc107",
        backgroundColor: "#fffbf0",
        iconColor: "#ffc107",
        titleColor: "#664d03",
        defaultIcon: "ti-alert-triangle",
      },
      danger: {
        borderColor: "#dc3545",
        backgroundColor: "#fff5f5",
        iconColor: "#dc3545",
        titleColor: "#721c24",
        defaultIcon: "ti-alert-circle",
      },
      help: {
        borderColor: "#6f42c1",
        backgroundColor: "#f8f5ff",
        iconColor: "#6f42c1",
        titleColor: "#432874",
        defaultIcon: "ti-help",
      },
    };

    return configs[variant] || configs.info;
  };

  const config = getVariantConfig(variant);
  const iconClass = icon || config.defaultIcon;

  return (
    <Card
      className={`border-0 ${className}`}
      style={{
        borderLeft: `4px solid ${config.borderColor}`,
        backgroundColor: config.backgroundColor,
      }}
    >
      <Card.Body className="py-3">
        <div className="d-flex align-items-start">
          <div
            className="flex-shrink-0 me-3 mt-1"
            style={{ color: config.iconColor }}
          >
            <i className={iconClass}></i>
          </div>
          <div className="flex-grow-1">
            {title && (
              <h6
                className="mb-2 fw-semibold"
                style={{ color: config.titleColor }}
              >
                {title}
              </h6>
            )}
            <div className="text-muted mb-0">{children}</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
