"use client";

/**
 * Simple placeholder components using CSS classes
 * Generic and reusable for any structure
 */

// Text placeholder - for titles, labels, paragraphs
export function TextPlaceholder({ width, className = "", ...props }) {
  const classes = ["ui-line", width && `ui-w-${width}`, className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...props} />;
}

// Block placeholder - for images, buttons, cards
export function BlockPlaceholder({
  width,
  height,
  className = "",
  style = {},
  ...props
}) {
  const classes = ["ui-block", width && `ui-w-${width}`, className]
    .filter(Boolean)
    .join(" ");
  const blockStyle = height ? { ...style, height } : style;

  return <div className={classes} style={blockStyle} {...props} />;
}

// Circle placeholder - for avatars
export function CirclePlaceholder({ size = "40px", className = "", ...props }) {
  return (
    <div
      className={`ui-block ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
      }}
      {...props}
    />
  );
}

// Generic card placeholder - flexible structure
export function CardPlaceholder({
  showImage = true,
  imageHeight = "200px",
  lines = 3,
  className = "",
}) {
  return (
    <div className={`card h-100 ${className}`}>
      {showImage && <BlockPlaceholder height={imageHeight} />}
      <div className="card-body">
        {Array.from({ length: lines }, (_, i) => {
          const widths = ["75", "60", "40", "80", "50"]; // Varied widths for realistic look
          return (
            <TextPlaceholder
              key={i}
              width={widths[i % widths.length]}
              className="mb-2"
            />
          );
        })}
      </div>
    </div>
  );
}
