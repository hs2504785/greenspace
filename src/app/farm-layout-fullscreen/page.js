"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Container, Badge, Button, Offcanvas } from "react-bootstrap";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import PureCSSGridFarm from "@/components/farm/PureCSSGridFarm";
import PlantTreeModal from "@/components/farm/PlantTreeModal";
import { getTreeType } from "@/utils/treeTypeClassifier";
import AdminGuard from "@/components/common/AdminGuard";
import EnhancedTreeDetailsModal from "@/components/modals/EnhancedTreeDetailsModal";
import TreeHistoryModal from "@/components/modals/TreeHistoryModal";
import FarmLayoutFilters from "@/components/features/farm/FarmLayoutFilters";

// Note: Tree types are now loaded from database dynamically

export default function FarmLayoutFullscreenPage() {
  const [trees, setTrees] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [initialPlantFormData, setInitialPlantFormData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [farmFilters, setFarmFilters] = useState({
    selectedLayout: null,
    showExpandButtons: (() => {
      // Load from localStorage, default to false for cleaner layout
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("farm-showExpandButtons");
        return saved ? JSON.parse(saved) : false;
      }
      return false;
    })(),
    showPlantingGuides: true,
    zoom: 1,
    isFullscreen: false,
  });

  // Get user ID from authentication - works for any admin/superadmin
  const { userId: farmId, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    // Set document title for client component
    document.title = "Farm Layout - Full View | Arya Natural Farms";
    if (farmId) {
      fetchData();
    }

    // Cleanup function to restore body scroll when leaving
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [farmId]);

  // Listen for global filter toggle from header
  useEffect(() => {
    const handleFilterToggle = () => {
      setShowFilters(true);
    };

    const handleRefreshFarmData = () => {
      fetchData();
    };

    window.addEventListener("toggle-farm-filters", handleFilterToggle);
    window.addEventListener("refresh-farm-data", handleRefreshFarmData);

    return () => {
      window.removeEventListener("toggle-farm-filters", handleFilterToggle);
      window.removeEventListener("refresh-farm-data", handleRefreshFarmData);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTrees(), fetchLayouts()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load farm data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrees = useCallback(async () => {
    try {
      const response = await fetch(`/api/trees?farmId=${farmId}`);
      if (response.ok) {
        const data = await response.json();
        setTrees(data);
      }
    } catch (error) {
      console.error("Error fetching trees:", error);
    }
  }, [farmId]);

  const fetchLayouts = async () => {
    try {
      const response = await fetch(`/api/farm-layouts?farmId=${farmId}`);
      if (response.ok) {
        const data = await response.json();
        setLayouts(data);
        const activeLayout = data.find((l) => l.is_active) || data[0];
        setSelectedLayout(activeLayout);
        // Update filters with the active layout
        setFarmFilters((prev) => ({
          ...prev,
          selectedLayout: activeLayout,
        }));
      }
    } catch (error) {
      console.error("Error fetching layouts:", error);
    }
  };

  const handleTreeClick = useCallback((tree, position) => {
    setSelectedPosition(position);
    if (tree) {
      setSelectedTree(tree);
      setShowTreeModal(true);
    } else {
      // Empty position clicked - show plant modal with empty fields
      setSelectedTree(null);
      generateUniquTreeCode(); // This will generate suggestions but not auto-fill
      setShowPlantModal(true);
    }
  }, []); // No dependencies - functions are stable

  const handleTreeHistoryClick = useCallback((tree, position) => {
    setSelectedPosition(position);
    setSelectedTree(tree);
    setShowHistoryModal(true);
  }, []);

  const generateUniquTreeCode = useCallback(() => {
    // Use tree codes from database
    const treeCodes = trees.map((t) => t.code);

    // Try to be more systematic - use position-based suggestions first
    let preferredCodes = [];

    // Suggest based on visual classification system
    if (selectedPosition) {
      const { x, y, blockIndex } = selectedPosition;

      // Use the same classification system as the visual circles
      const treeType = getTreeType(x, y, 24, 24);

      switch (treeType) {
        case "big":
        case "centerBig":
          // Big trees for corners and center
          preferredCodes = ["M", "JA", "CA", "A", "AV", "CO"];
          break;
        case "medium":
          // Medium trees for mid-edge positions
          preferredCodes = ["G", "L", "P", "C", "MR", "NE"];
          break;
        case "small":
          // Small trees for quarter positions
          preferredCodes = ["AN", "SF", "BC", "LC", "MF", "AM", "OR"];
          break;
        case "tiny":
        default:
          // Tiny trees for all other positions
          preferredCodes = ["AM", "OR", "BB", "LC", "MF", "BC", "SF"];
          break;
      }
    }

    // Combine preferred codes with all codes as fallback
    const codesToTry = [
      ...preferredCodes,
      ...treeCodes.filter((c) => !preferredCodes.includes(c)),
    ];

    let uniqueCode = "";

    // Find the first available code with lowest number
    for (const baseCode of codesToTry) {
      const existingCodes = trees
        .map((t) => t.code)
        .filter((code) => code.startsWith(baseCode))
        .map((code) => {
          const num = code.replace(baseCode, "");
          return num === "" ? 1 : parseInt(num) || 1;
        })
        .sort((a, b) => a - b);

      let nextNumber = 1;
      for (const num of existingCodes) {
        if (num === nextNumber) {
          nextNumber++;
        } else {
          break;
        }
      }

      uniqueCode = nextNumber === 1 ? baseCode : `${baseCode}${nextNumber}`;

      // Check if this code truly doesn't exist (double-check)
      const codeExists = trees.some((t) => t.code === uniqueCode);
      if (!codeExists) {
        break; // Found a unique code
      }
    }

    // Generate a descriptive name based on the code
    const getTreeNameFromCode = (code) => {
      const baseName = code.replace(/\d+$/, ""); // Remove numbers
      const dbTree = trees.find((t) => t.code === baseName);
      return dbTree ? dbTree.name : `${code} Tree`;
    };

    setInitialPlantFormData({
      tree_id: "",
      new_tree: {
        code: "",
        name: "",
        scientific_name: "",
        variety: "",
        status: "healthy",
      },
      // Store suggestions for optional use
      suggestions: {
        code: uniqueCode,
        name: getTreeNameFromCode(uniqueCode),
      },
    });
  }, [trees, selectedPosition]); // Added selectedPosition dependency for position-based suggestions

  // Callback for when tree is successfully planted
  const handleTreePlanted = useCallback(
    async (newTree) => {
      // Close the plant modal immediately to prevent double-clicks
      setShowPlantModal(false);
      setSelectedPosition(null);

      // Show loading feedback
      toast.loading("Refreshing farm layout...", { id: "refresh-farm" });

      try {
        // Force refresh of tree data from server (don't rely on local state update)
        await fetchTrees();

        // Trigger refresh of grid component
        setRefreshKey((prev) => prev + 1);

        toast.success("Tree planted and layout refreshed!", {
          id: "refresh-farm",
        });
      } catch (error) {
        console.error("Error refreshing trees:", error);
        toast.error("Tree planted but failed to refresh layout", {
          id: "refresh-farm",
        });
      }
    },
    [fetchTrees]
  );

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast.error("Fullscreen not supported on this device");
    }
  };

  const updateFarmFilters = (newFilters) => {
    setFarmFilters((prev) => {
      const updated = { ...prev, ...newFilters };

      // Handle localStorage for showExpandButtons
      if ("showExpandButtons" in newFilters) {
        localStorage.setItem(
          "farm-showExpandButtons",
          JSON.stringify(newFilters.showExpandButtons)
        );
      }

      // Handle layout changes
      if ("selectedLayout" in newFilters && newFilters.selectedLayout) {
        setSelectedLayout(newFilters.selectedLayout);
      }

      // Handle zoom changes
      if ("zoom" in newFilters) {
        setZoom(newFilters.zoom);
      }

      // Handle fullscreen toggle
      if ("isFullscreen" in newFilters) {
        if (newFilters.isFullscreen && !isFullscreen) {
          toggleFullscreen();
        } else if (!newFilters.isFullscreen && isFullscreen) {
          toggleFullscreen();
        }
      }

      return updated;
    });
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const getTreeStats = () => {
    const totalTrees = trees.length;
    const healthyTrees = trees.filter((t) => t.status === "healthy").length;
    const fruitingTrees = trees.filter((t) => t.status === "fruiting").length;
    const diseasedTrees = trees.filter((t) => t.status === "diseased").length;
    return { totalTrees, healthyTrees, fruitingTrees, diseasedTrees };
  };

  const stats = getTreeStats();

  if (loading || userLoading || !farmId) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div
            className="spinner-border text-success"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">
            {userLoading
              ? "Loading user data..."
              : "Loading your farm layout..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard requiredRole="admin">
      <div className="farm-layout-fullscreen">
        {/* Disable body scroll and add proper spacing */}
        <style jsx global>{`
          body {
            overflow: hidden;
          }
          .farm-layout-fullscreen {
            height: 100vh;
            overflow: hidden;
          }
        `}</style>

        {/* Main Farm Grid - Full Screen */}
        <div
          className="farm-grid-container"
          style={{
            position: "fixed",
            top: "80px", // Account for header height + some padding
            left: farmFilters.showExpandButtons ? "20px" : "0px",
            right: farmFilters.showExpandButtons ? "20px" : "0px",
            bottom: "0px",
            overflow: "auto",
            backgroundColor: farmFilters.showExpandButtons
              ? "#f8f9fa"
              : "#ffffff",
            transition: "all 0.3s ease",
          }}
        >
          <div
            className="farm-grid-wrapper"
            style={{
              width: "100%",
              height: "100%",
              padding: farmFilters.showExpandButtons ? "20px" : "10px",
              transition: "padding 0.3s ease",
            }}
          >
            <PureCSSGridFarm
              farmId={farmId}
              selectedLayoutId={
                farmFilters.selectedLayout?.id || selectedLayout?.id
              }
              onTreeClick={handleTreeClick}
              onTreeHistoryClick={handleTreeHistoryClick}
              showExpandButtons={farmFilters.showExpandButtons}
              showHeader={false}
              zoom={farmFilters.zoom || zoom}
              refreshKey={refreshKey}
              trees={trees}
            />
          </div>
        </div>

        {/* Plant Tree Modal */}
        <PlantTreeModal
          show={showPlantModal}
          onHide={() => setShowPlantModal(false)}
          selectedPosition={selectedPosition}
          trees={trees}
          farmId={farmId}
          selectedLayout={selectedLayout}
          onTreePlanted={handleTreePlanted}
          initialFormData={initialPlantFormData}
        />

        {/* Enhanced Tree Details Modal */}
        <EnhancedTreeDetailsModal
          key={selectedTree?.id || "no-tree"}
          show={showTreeModal}
          onHide={() => setShowTreeModal(false)}
          selectedTree={selectedTree}
          selectedPosition={selectedPosition}
          onTreeUpdated={async () => {
            // Close the tree details modal
            setShowTreeModal(false);
            // Clear selected tree to prevent showing stale data
            setSelectedTree(null);
            // Refresh data and grid
            await fetchTrees();
            setRefreshKey((prev) => prev + 1);
          }}
          onTreeDeleted={async () => {
            // Close the tree details modal
            setShowTreeModal(false);
            // Clear selected tree to prevent showing stale data
            setSelectedTree(null);
            // Refresh data and grid
            await fetchTrees();
            setRefreshKey((prev) => prev + 1);
          }}
          farmId={farmId}
          layoutId={selectedLayout?.id}
        />

        {/* Tree History Modal */}
        <TreeHistoryModal
          show={showHistoryModal}
          onHide={() => setShowHistoryModal(false)}
          selectedTree={selectedTree}
          selectedPosition={selectedPosition}
        />

        {/* Farm Layout Filters */}
        <FarmLayoutFilters
          show={showFilters}
          onHide={() => setShowFilters(false)}
          filters={farmFilters}
          onFilterChange={updateFarmFilters}
          layouts={layouts}
          stats={stats}
        />
      </div>
    </AdminGuard>
  );
}
