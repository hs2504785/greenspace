import React, { useState, useEffect } from "react";
import { Button, Offcanvas } from "react-bootstrap";

/**
 * OffcanvasDescription Component
 *
 * A mobile-optimized component that shows descriptions in an offcanvas panel
 * for better readability and user experience on small screens.
 */
export default function OffcanvasDescription({
  description,
  title = "Description",
  maxLines = 3,
  charactersPerLine = 80,
  className = "",
  style = {},
}) {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!description || description.trim() === "") {
    return null;
  }

  // Calculate truncation
  const maxCharacters = maxLines * charactersPerLine;
  const shouldTruncate = description.length > maxCharacters;

  const findBreakPoint = (text, maxLength) => {
    if (text.length <= maxLength) return text.length;
    const sentenceEnd = text.lastIndexOf(".", maxLength);
    if (sentenceEnd > maxLength * 0.7) return sentenceEnd + 1;
    const wordEnd = text.lastIndexOf(" ", maxLength);
    if (wordEnd > maxLength * 0.7) return wordEnd;
    return maxLength;
  };

  const breakPoint = shouldTruncate
    ? findBreakPoint(description, maxCharacters)
    : description.length;
  const truncatedText = description.substring(0, breakPoint);

  // Calculate reading stats
  const wordCount = description.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  const readingTimeText =
    readingTime === 1 ? "1 min read" : `${readingTime} min read`;

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div className={`offcanvas-description ${className}`} style={style}>
      {/* Truncated description */}
      <p
        className="text-dark lead mb-2"
        style={{
          lineHeight: "1.6",
          whiteSpace: "pre-line",
          color: "#495057",
          fontSize: "1.1rem",
          marginBottom: shouldTruncate ? "0.5rem" : "0",
        }}
      >
        {truncatedText}
        {shouldTruncate && <span className="text-muted">...</span>}
      </p>

      {/* Show More button - opens offcanvas */}
      {shouldTruncate && (
        <div className="mt-2">
          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
            <Button
              variant="outline-success"
              size="sm"
              className="d-inline-flex align-items-center flex-shrink-0"
              style={{
                fontSize: "0.85rem",
                fontWeight: "500",
                padding: "0.4rem 1rem",
                borderRadius: "20px",
                transition: "all 0.2s ease-in-out",
                minWidth: "120px",
              }}
              onClick={handleShow}
            >
              <i
                className="ti-external-link me-1"
                style={{ fontSize: "0.9rem" }}
              ></i>
              Read Full Details
            </Button>

            {/* Reading info indicators - aligned with button */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="badge bg-light text-dark px-2 py-1 rounded-pill">
                <i className="ti-file me-1" style={{ fontSize: "0.7rem" }}></i>
                {truncatedText.length}/{description.length} chars
              </span>

              {wordCount > 50 && (
                <span className="badge bg-light text-dark px-2 py-1 rounded-pill">
                  <i
                    className="ti-time me-1"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                  {readingTimeText}
                </span>
              )}

              <span className="badge bg-light text-dark px-2 py-1 rounded-pill">
                <i className="ti-text me-1" style={{ fontSize: "0.7rem" }}></i>
                {wordCount} words
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Offcanvas Panel */}
      <Offcanvas
        show={show}
        onHide={handleClose}
        placement={isMobile ? "bottom" : "end"}
        style={{
          height: isMobile ? "90vh" : "100vh",
          maxHeight: isMobile ? "90vh" : "100vh",
        }}
        className="offcanvas-description-panel"
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="h5 fw-bold text-success">
            <i className="ti-file-text me-2"></i>
            {title}
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="p-0">
          <div className="p-3 h-100 overflow-auto">
            {/* Full description content */}
            <div
              className="description-content"
              style={{
                lineHeight: "1.7",
                fontSize: "1.1rem",
                color: "#495057",
                whiteSpace: "pre-line",
              }}
            >
              {description}
            </div>

            {/* Reading stats as pills at bottom */}
            <div className="d-flex flex-wrap gap-2 mt-3">
              <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                <i className="ti-file me-1" style={{ fontSize: "0.75rem" }}></i>
                {description.length} characters
              </span>
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                <i className="ti-time me-1" style={{ fontSize: "0.75rem" }}></i>
                {readingTimeText}
              </span>
              <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
                <i className="ti-text me-1" style={{ fontSize: "0.75rem" }}></i>
                {wordCount} words
              </span>
            </div>

            {/* Bottom padding for better scrolling */}
            <div style={{ height: "2rem" }}></div>
          </div>
        </Offcanvas.Body>

        {/* Footer with action buttons */}
        <div className="border-top p-3 bg-light">
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleClose}
              className="flex-fill"
            >
              <i className="ti-arrow-left me-1"></i>
              Close
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                // Copy to clipboard functionality
                navigator.clipboard.writeText(description).then(() => {
                  // You could add a toast notification here
                  console.log("Description copied to clipboard");
                });
              }}
              className="flex-fill"
            >
              <i className="ti-clipboard me-1"></i>
              Copy Text
            </Button>
          </div>
        </div>
      </Offcanvas>
    </div>
  );
}
