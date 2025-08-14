'use client';

import { memo } from 'react';

const VegetableCount = memo(function VegetableCount({ count, loading }) {
  if (loading) {
    return (
      <span className="badge bg-secondary ms-2 fs-6">
        Loading...
      </span>
    );
  }
  return (
    <span className="badge bg-success ms-2 fs-6">
      {count} {count === 1 ? 'vegetable' : 'vegetables'}
    </span>
  );
});

export default VegetableCount;
