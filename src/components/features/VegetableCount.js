"use client";

import { memo } from "react";

const VegetableCount = memo(function VegetableCount({ count, loading }) {
  if (loading) {
    return (
      <div
        className="ms-2"
        style={{ width: "100px", height: "24px", display: "inline-block" }}
      >
        <div
          className="ui-line ui-w-100"
          style={{ height: "24px", borderRadius: "12px" }}
        ></div>
      </div>
    );
  }
  return (
    <span className="badge bg-success ms-2 fs-6">
      {count} {count === 1 ? "vegetable" : "vegetables"}
    </span>
  );
});

export default VegetableCount;
