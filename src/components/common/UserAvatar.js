'use client';

import { useState } from 'react';
import { Image } from 'react-bootstrap';

export default function UserAvatar({ user, size = 32, className = '' }) {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getRandomColor = (name) => {
    const colors = [
      '#2196F3', // Blue
      '#4CAF50', // Green
      '#F44336', // Red
      '#FFC107', // Amber
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
      '#FF9800', // Orange
      '#795548', // Brown
    ];
    
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const [imageError, setImageError] = useState(false);

  if (user?.image && !imageError) {
    return (
      <Image
        src={user.image}
        alt={user.name || 'User'}
        width={size}
        height={size}
        className={`rounded-circle ${className}`}
        style={{ objectFit: 'cover' }}
        onError={() => setImageError(true)}
      />
    );
  }

  const initials = getInitials(user?.name);
  const backgroundColor = getRandomColor(user?.name);
  const fontSize = Math.floor(size * 0.4);

  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        color: 'white',
        fontSize: `${fontSize}px`,
        fontWeight: '500',
        textTransform: 'uppercase'
      }}
    >
      {initials}
    </div>
  );
}
