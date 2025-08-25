"use client";

import { useState } from "react";
import { Image } from "react-bootstrap";

export default function UserAvatar({ user, size = 32, className = "" }) {
  const getInitials = (name) => {
    if (!name || !name.trim()) return "?";

    // Clean and split the name, filtering out empty parts
    const parts = name
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0);

    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    // For multiple parts, use first letter of first part and first letter of last part
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getRandomColor = (name) => {
    const colors = [
      "#2196F3", // Blue
      "#4CAF50", // Green
      "#F44336", // Red
      "#FFC107", // Amber
      "#9C27B0", // Purple
      "#00BCD4", // Cyan
      "#FF9800", // Orange
      "#795548", // Brown
      "#607D8B", // Blue Grey
      "#E91E63", // Pink
      "#009688", // Teal
      "#3F51B5", // Indigo
    ];

    if (!name || !name.trim()) return colors[0];

    // Generate hash from cleaned name
    const cleanName = name.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const [imageError, setImageError] = useState(false);

  if (user?.image && !imageError) {
    return (
      <Image
        src={user.image}
        alt={user.name || "User"}
        width={size}
        height={size}
        className={`rounded-circle flex-shrink-0 ${className}`}
        style={{
          objectFit: "cover",
          minWidth: size,
          minHeight: size,
          maxWidth: size,
          maxHeight: size,
        }}
        onError={() => setImageError(true)}
      />
    );
  }

  const initials = getInitials(user?.name);
  const backgroundColor = getRandomColor(user?.name);
  const fontSize = Math.floor(size * 0.4);

  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        backgroundColor,
        color: "white",
        fontSize: `${fontSize}px`,
        fontWeight: "900",
        textTransform: "uppercase",
      }}
    >
      {initials}
    </div>
  );
}
