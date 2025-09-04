import React, { useState, useRef, useEffect } from "react";
import { Button } from "react-bootstrap";

/**
 * ExpandableDescription Component
 *
 * A reusable component that shows a truncated description with expand/collapse functionality.
 * Provides better UX by maintaining layout stability and allowing users to control content visibility.
 *
 * @param {Object} props
 * @param {string} props.description - The full description text
 * @param {number} props.maxLines - Maximum lines to show when collapsed (default: 3)
 * @param {number} props.charactersPerLine - Approximate characters per line for truncation (default: 80)
 * @param {number} props.maxExpandedHeight - Maximum height when expanded in pixels (default: 300)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
export default function ExpandableDescription({
  description,
  maxLines = 3,
  charactersPerLine = 80,
  maxExpandedHeight = 300,
  className = "",
  style = {},
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const containerRef = useRef(null);

  if (!description || description.trim() === "") {
    return null;
  }

  // Check if content is scrollable when expanded
  useEffect(() => {
    if (isExpanded && containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      const isContentScrollable = scrollHeight > clientHeight;
      setIsScrollable(isContentScrollable);
      setShowBottomFade(isContentScrollable); // Show fade initially if scrollable
    }
  }, [isExpanded, description]);

  // Handle scroll to show/hide bottom fade
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    setShowBottomFade(!isNearBottom && isScrollable);
  };

  // Calculate approximate truncation point
  const maxCharacters = maxLines * charactersPerLine;
  const shouldTruncate = description.length > maxCharacters;

  // Find a good breaking point (end of sentence or word)
  const findBreakPoint = (text, maxLength) => {
    if (text.length <= maxLength) return text.length;

    // Try to break at sentence end
    const sentenceEnd = text.lastIndexOf(".", maxLength);
    if (sentenceEnd > maxLength * 0.7) return sentenceEnd + 1;

    // Try to break at word boundary
    const wordEnd = text.lastIndexOf(" ", maxLength);
    if (wordEnd > maxLength * 0.7) return wordEnd;

    // Fallback to character limit
    return maxLength;
  };

  const breakPoint = shouldTruncate
    ? findBreakPoint(description, maxCharacters)
    : description.length;
  const truncatedText = description.substring(0, breakPoint);
  const displayText = isExpanded ? description : truncatedText;

  // Calculate reading time (average 200 words per minute)
  const wordCount = description.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  const readingTimeText =
    readingTime === 1 ? "1 min read" : `${readingTime} min read`;

  return (
    <div className={`expandable-description ${className}`} style={style}>
      <div
        ref={containerRef}
        className="description-text-container"
        data-scrollable={isScrollable}
        data-show-bottom-fade={showBottomFade}
        style={{
          overflow: isExpanded ? "auto" : "hidden",
          maxHeight: isExpanded ? `${maxExpandedHeight}px` : "none", // Limit expanded height
          transition: "all 0.4s ease-in-out",
          scrollbarWidth: "thin", // Firefox
          scrollbarColor: "#ccc transparent", // Firefox
        }}
        onScroll={handleScroll}
      >
        <p
          className="text-muted lead mb-2"
          style={{
            lineHeight: "1.6",
            marginBottom: shouldTruncate ? "0.5rem" : "0",
            whiteSpace: "pre-line", // Preserve line breaks
            opacity: 1,
            transition: "opacity 0.3s ease-in-out",
            paddingRight: isExpanded ? "0.5rem" : "0", // Space for scrollbar
          }}
        >
          {displayText}
          {!isExpanded && shouldTruncate && (
            <span
              className="text-muted fade-ellipsis"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(248, 249, 250, 0.8) 50%)",
                paddingLeft: "0.5rem",
                animation: "fadeIn 0.3s ease-in-out",
              }}
            >
              ...
            </span>
          )}
        </p>
      </div>

      {shouldTruncate && (
        <div className="mt-2">
          <div className="d-flex align-items-center">
            <Button
              variant={isExpanded ? "success" : "outline-success"}
              size="sm"
              className="read-more-btn d-inline-flex align-items-center"
              style={{
                fontSize: "0.8rem",
                fontWeight: "500",
                padding: "0.25rem 0.75rem",
                borderRadius: "20px",
                transition: "all 0.2s ease-in-out",
              }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <i
                    className="ti-angle-up me-1"
                    style={{ fontSize: "0.9rem" }}
                  ></i>
                  Show Less
                </>
              ) : (
                <>
                  <i
                    className="ti-angle-down me-1"
                    style={{ fontSize: "0.9rem" }}
                  ></i>
                  Read More
                </>
              )}
            </Button>

            {/* Reading info indicators */}
            <div className="d-flex align-items-center ms-2 gap-2">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                {isExpanded
                  ? `${description.length} characters`
                  : `${truncatedText.length}/${description.length} characters`}
              </small>

              {wordCount > 50 && (
                <>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    •
                  </span>
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    <i
                      className="ti-time me-1"
                      style={{ fontSize: "0.7rem" }}
                    ></i>
                    {readingTimeText}
                  </small>
                </>
              )}

              {isExpanded && showBottomFade && (
                <>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    •
                  </span>
                  <small
                    className="text-success"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <i
                      className="ti-arrow-down me-1"
                      style={{ fontSize: "0.7rem" }}
                    ></i>
                    Scroll for more
                  </small>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
