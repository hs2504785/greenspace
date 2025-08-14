"use client";

import { Row, Col } from "react-bootstrap";

/**
 * Reusable EmptyState component for showing empty screens
 * @param {Object} props
 * @param {string} props.icon - Themify icon class (e.g., "ti-package", "ti-shopping-cart")
 * @param {string} props.title - Main title text
 * @param {string} props.description - Description text (can include HTML)
 * @param {React.ReactNode} props.action - Optional action button or component
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.iconColor - Icon color class (default: "text-muted")
 * @param {string} props.size - Size variant ("sm", "md", "lg") (default: "md")
 */
export default function EmptyState({
  icon = "ti-package",
  title = "No items found",
  description = "There are currently no items to display.",
  action = null,
  className = "",
  iconColor = "text-muted",
  size = "md",
}) {
  // Size configurations
  const sizeConfig = {
    sm: {
      iconClass: "display-5",
      titleClass: "h4",
      padding: "py-4",
    },
    md: {
      iconClass: "display-3",
      titleClass: "h3",
      padding: "py-5",
    },
    lg: {
      iconClass: "display-1",
      titleClass: "h2",
      padding: "py-6",
    },
    xl: {
      iconClass: "display-1",
      titleClass: "h1",
      padding: "py-6",
      iconStyle: { fontSize: "8rem" }, // Extra large icon
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        marginTop: "-80px",
        background:
          "linear-gradient(135deg, #f8fffe 0%, #f0f9f4 50%, #ecfdf5 100%)",
        position: "relative",
      }}
    >
      {/* Decorative elements */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "10%",
          width: "60px",
          height: "60px",
          background: "linear-gradient(45deg, #dcfce7, #bbf7d0)",
          borderRadius: "50%",
          opacity: 0.3,
          animation: "float 6s ease-in-out infinite",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          top: "60%",
          right: "15%",
          width: "40px",
          height: "40px",
          background: "linear-gradient(45deg, #fef3c7, #fde68a)",
          borderRadius: "50%",
          opacity: 0.4,
          animation: "float 8s ease-in-out infinite reverse",
        }}
      ></div>

      <Row className="justify-content-center w-100">
        <Col xs={12} md={8} lg={6}>
          <div className={`text-center ${config.padding} ${className}`}>
            {/* Icon with natural farming color */}
            <div className="mb-4">
              <i
                className={`${icon} ${config.iconClass}`}
                style={{
                  ...config.iconStyle,
                  background:
                    "linear-gradient(135deg, #22c55e, #16a34a, #15803d)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 2px 4px rgba(34, 197, 94, 0.2))",
                }}
              ></i>
            </div>

            {/* Title with natural color */}
            <h3
              className={`${config.titleClass} mb-3`}
              style={{ color: "#166534" }}
            >
              {title}
            </h3>

            {/* Description with warm earth tone */}
            <div
              className="mb-4"
              style={{ color: "#65a30d" }}
              dangerouslySetInnerHTML={{ __html: description }}
            />

            {/* Action button or component */}
            {action && <div className="mt-4">{action}</div>}
          </div>
        </Col>
      </Row>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
