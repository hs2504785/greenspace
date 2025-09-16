"use client";

import React, { useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import styles from "./NodeTypeContextMenu.module.css";
import { getTreeTypeClass } from "../../utils/treeTypeClassifier";

const NodeTypeContextMenu = ({
  show,
  x,
  y,
  currentType,
  onTypeChange,
  onClose,
  onGrowthHistoryClick,
  selectedTree,
  selectedPosition,
}) => {
  if (!show) return null;

  // Function to get circle colors matching the grid layout
  const getCircleColor = (nodeType) => {
    switch (nodeType) {
      case "big":
        return "#e91e63"; // Hot Pink
      case "centerBig":
        return "#00ff7f"; // Spring Green
      case "medium":
        return "#9c27b0"; // Purple
      case "small":
        return "#00bcd4"; // Cyan
      case "tiny":
        return "#ffc107"; // Gold/Yellow
      case "default":
        return "#6c757d"; // Gray
      default:
        return "#6c757d";
    }
  };

  const nodeTypes = [
    {
      value: "auto",
      label: "Auto",
      circleClass: null,
      icon: "🔄",
    },
    {
      value: "default",
      label: "Default",
      circleClass: "treeCircleDefault",
    },
    {
      value: "big",
      label: "Big Tree",
      circleClass: "treeCircleBig",
    },
    {
      value: "centerBig",
      label: "Center Big",
      circleClass: "treeCircleCenterBig",
    },
    {
      value: "medium",
      label: "Medium Tree",
      circleClass: "treeCircleMedium",
    },
    {
      value: "small",
      label: "Small Tree",
      circleClass: "treeCircle",
    },
    {
      value: "tiny",
      label: "Tiny/Ground",
      circleClass: "treeCircleTiny",
    },
  ];

  const handleTypeSelect = useCallback(
    (type) => {
      onTypeChange(type);
      onClose();
    },
    [onTypeChange, onClose]
  );

  const handleGrowthHistory = useCallback(() => {
    if (onGrowthHistoryClick && selectedTree) {
      onGrowthHistoryClick(selectedTree, selectedPosition);
      onClose();
    }
  }, [onGrowthHistoryClick, selectedTree, selectedPosition, onClose]);

  // No need for click outside handling here - parent handles it

  return (
    <div
      className={styles.contextMenuOverlay}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: show ? "auto" : "none",
      }}
    >
      <div
        className={styles.contextMenu}
        style={{
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          width: "180px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          border: "1px solid #e9ecef",
          borderRadius: "0px",
          overflow: "hidden",
          backgroundColor: "white",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {nodeTypes.map((type) => (
          <Button
            key={type.value}
            variant="light"
            className={`${styles.menuItem} w-100 text-start border-0 rounded-0 d-flex align-items-center`}
            onClick={() => handleTypeSelect(type.value)}
            style={{
              padding: "6px 10px",
              borderBottom: "1px solid #f8f9fa",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              backgroundColor: "transparent",
              color: "#495057",
            }}
          >
            <div
              className="d-flex align-items-center me-2"
              style={{ minWidth: "20px" }}
            >
              {type.circleClass ? (
                <div
                  className={styles.menuCircle}
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: getCircleColor(type.value),
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    fontWeight: "600",
                    color: getCircleColor(type.value),
                    lineHeight: "1",
                  }}
                >
                  {type.value === "default" ? "" : type.label.charAt(0)}
                </div>
              ) : (
                <span style={{ fontSize: "12px" }}>{type.icon}</span>
              )}
            </div>
            <div className="flex-grow-1">
              <div className="fw-medium small">{type.label}</div>
            </div>
            {currentType === type.value && (
              <i className="ti-check ms-1" style={{ fontSize: "12px" }}></i>
            )}
          </Button>
        ))}

        {/* Growth History Separator */}
        <div style={{ borderTop: "1px solid #dee2e6", margin: "0" }}></div>

        {/* Growth History Option */}
        <Button
          variant="light"
          className={`${styles.menuItem} w-100 text-start border-0 rounded-0 d-flex align-items-center`}
          onClick={handleGrowthHistory}
          disabled={!onGrowthHistoryClick || !selectedTree}
          style={{
            padding: "6px 10px",
            backgroundColor: "transparent",
            color: onGrowthHistoryClick && selectedTree ? "#198754" : "#6c757d",
            borderTop: "none",
            borderBottom: "none",
            borderLeft: "none",
            borderRight: "none",
            opacity: onGrowthHistoryClick && selectedTree ? 1 : 0.5,
          }}
        >
          <div
            className="d-flex align-items-center me-2"
            style={{ minWidth: "20px" }}
          >
            <span style={{ fontSize: "12px" }}>📸</span>
          </div>
          <div className="flex-grow-1">
            <div className="fw-medium small">Growth History</div>
          </div>
          <i className="ti-arrow-right ms-1" style={{ fontSize: "10px" }}></i>
        </Button>
      </div>
    </div>
  );
};

export default NodeTypeContextMenu;
