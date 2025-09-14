"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Badge,
  Button,
  Card,
  Carousel,
  Table,
  Tabs,
  Tab,
} from "react-bootstrap";
import Image from "next/image";
import OffcanvasDescription from "../ui/OffcanvasDescription";

// Helper function to get tree category icon
const getTreeCategoryIcon = (category) => {
  const icons = {
    citrus: "🍊",
    tropical: "🥭",
    stone: "🍑",
    berry: "🫐",
    nut: "🥥",
    exotic: "🌳",
    medicinal: "🌿",
    spice: "🌶️",
    default: "🌳",
  };
  return icons[category?.toLowerCase()] || icons.default;
};

// Helper function to get season badge color
const getSeasonBadgeColor = (season) => {
  const colors = {
    "year-round": "success",
    summer: "warning",
    winter: "info",
    monsoon: "primary",
    spring: "success",
    autumn: "secondary",
  };
  return colors[season?.toLowerCase()] || "secondary";
};

// Helper function to get status badge color
const getStatusBadgeColor = (status) => {
  const colors = {
    healthy: "success",
    diseased: "danger",
    fruiting: "warning",
    dormant: "secondary",
    dead: "dark",
  };
  return colors[status?.toLowerCase()] || "secondary";
};

// Helper function to get tree benefits based on category, name, and variety
const getTreeBenefits = (tree) => {
  const benefits = [];
  const variety = tree.variety?.toLowerCase();
  const name = tree.name?.toLowerCase() || "";

  // Variety-specific benefits (more specific than general tree benefits)
  if (variety) {
    if (name.includes("mango")) {
      if (variety.includes("alphonso") || variety.includes("alphanso")) {
        benefits.push(
          "Premium taste",
          "Creamy texture",
          "Rich aroma",
          "King of mangoes"
        );
      } else if (variety.includes("kesar")) {
        benefits.push(
          "Saffron color",
          "Sweet flavor",
          "Queen of mangoes",
          "Extended shelf life"
        );
      } else if (variety.includes("totapuri")) {
        benefits.push(
          "Versatile use",
          "Good for pickles",
          "Firm texture",
          "Dual purpose"
        );
      } else if (variety.includes("dasheri")) {
        benefits.push(
          "Fiber-free flesh",
          "Aromatic",
          "Sweet taste",
          "Premium quality"
        );
      }
    } else if (name.includes("guava")) {
      if (variety.includes("allahabad")) {
        benefits.push(
          "Large size",
          "White flesh",
          "Fewer seeds",
          "High vitamin C"
        );
      } else if (variety.includes("apple")) {
        benefits.push(
          "Crisp texture",
          "Apple-like taste",
          "Pleasant aroma",
          "Rich in vitamin C"
        );
      } else if (variety.includes("pink")) {
        benefits.push(
          "Pink flesh",
          "Sweet aroma",
          "High nutrition",
          "Beautiful appearance"
        );
      }
    }
  }

  // If no variety-specific benefits, use general benefits
  if (benefits.length === 0) {
    // Category-based benefits
    if (tree.category === "citrus") {
      benefits.push(
        "Rich in Vitamin C",
        "Boosts immunity",
        "Antioxidant properties"
      );
    } else if (tree.category === "tropical") {
      benefits.push("High in vitamins", "Natural enzymes", "Digestive health");
    } else if (tree.category === "medicinal") {
      benefits.push(
        "Therapeutic properties",
        "Natural healing",
        "Traditional medicine"
      );
    } else if (tree.category === "nut") {
      benefits.push("Healthy fats", "Protein source", "Heart healthy");
    } else if (tree.category === "berry") {
      benefits.push("Antioxidants", "Anti-inflammatory", "Brain health");
    }

    // Name-based benefits
    if (name.includes("neem")) {
      benefits.push("Natural pesticide", "Skin health", "Antibacterial");
    } else if (name.includes("tulsi") || name.includes("basil")) {
      benefits.push("Stress relief", "Respiratory health", "Sacred plant");
    } else if (name.includes("guava")) {
      benefits.push("Digestive health", "Blood sugar control", "Wound healing");
    } else if (name.includes("mango")) {
      benefits.push("Eye health", "Skin health", "Digestive enzymes");
    } else if (name.includes("coconut")) {
      benefits.push("Hydration", "Electrolytes", "Healthy fats");
    } else if (name.includes("pomegranate")) {
      benefits.push("Heart health", "Anti-aging", "Memory boost");
    }
  }

  return [...new Set(benefits)]; // Remove duplicates
};

// Helper function to determine if tree is superfood
const isSuperfood = (tree) => {
  const superfoodTrees = [
    "pomegranate",
    "guava",
    "amla",
    "moringa",
    "neem",
    "tulsi",
    "coconut",
    "avocado",
    "jackfruit",
    "papaya",
    "drumstick",
  ];
  const name = tree.name?.toLowerCase() || "";
  return superfoodTrees.some((superfood) => name.includes(superfood));
};

// Helper function to get care tips based on tree data and variety
const getCareTips = (tree) => {
  const tips = [];
  const variety = tree.variety?.toLowerCase();
  const name = tree.name?.toLowerCase() || "";

  // Variety-specific care tips
  if (variety && name.includes("mango")) {
    if (variety.includes("alphonso") || variety.includes("alphanso")) {
      tips.push(
        "Requires well-drained soil with good organic content",
        "Water regularly during flowering and fruit development",
        "Protect from strong winds during fruiting season",
        "Apply balanced fertilizer before flowering season"
      );
    } else if (variety.includes("kesar")) {
      tips.push(
        "Thrives in semi-arid climate with good drainage",
        "Reduce watering during fruit maturation for better flavor",
        "Prune to maintain good air circulation",
        "Apply potash-rich fertilizer for better fruit color"
      );
    } else {
      // General mango care
      tips.push(
        "Water deeply but infrequently",
        "Prune after harvest season",
        "Apply organic compost annually",
        "Monitor for mango hoppers and fruit flies"
      );
    }
  } else if (variety && name.includes("guava")) {
    tips.push(
      "Water regularly but ensure good drainage",
      "Prune to maintain shape and air circulation",
      "Apply balanced NPK fertilizer quarterly",
      "Watch for fruit flies and scale insects"
    );
  } else {
    // General care tips based on category
    if (tree.category === "citrus") {
      tips.push(
        "Water regularly but avoid waterlogging",
        "Prune after fruiting season",
        "Apply organic fertilizer monthly",
        "Watch for citrus pests like aphids"
      );
    } else if (tree.category === "tropical") {
      tips.push(
        "Provide adequate shade when young",
        "Mulch around the base",
        "Water deeply but less frequently",
        "Protect from strong winds"
      );
    } else {
      tips.push(
        "Water according to season",
        "Prune dead or diseased branches",
        "Apply compost annually",
        "Monitor for pests and diseases"
      );
    }
  }

  return tips;
};

// Helper function to get tree/fruit images from free online sources
const getTreeImages = (tree) => {
  const treeName = tree.base_tree_name || tree.name || "";
  const variety = tree.variety || "";

  // For now, use local images as placeholders
  // TODO: Add actual tree/fruit images to public/images/ directory
  const treeImageMap = {
    // Mango varieties - generic mango images only
    mango: [
      "/images/trees/mango/mango-1.jpg",
      "/images/trees/mango/mango-2.jpg",
      "/images/trees/mango/mango-3.jpg",
    ],

    // Guava varieties - add your downloaded images here
    guava: [
      // Example structure - uncomment and update paths when you add images:
      // "/images/trees/guava/pink-guava-1.jpg",
      // "/images/trees/guava/white-guava-1.jpg",
      // "/images/trees/guava/generic-guava-1.jpg",

      // Temporary fallbacks until you add real images:
      "/images/ridge-gourd.jpg", // Remove when you add real guava images
      "/images/tomato.jpg", // Remove when you add real guava images
    ],

    // Lemon varieties - add your downloaded images here
    lemon: [
      // Example structure - uncomment and update paths when you add images:
      // "/images/trees/lemon/sweet-lemon-1.jpg",
      // "/images/trees/lemon/kagzi-lemon-1.jpg",
      // "/images/trees/lemon/generic-lemon-1.jpg",

      // Temporary fallbacks until you add real images:
      "/images/tomato.jpg", // Remove when you add real lemon images
      "/images/ridge-gourd.jpg", // Remove when you add real lemon images
    ],

    // Default fallback images - local placeholders
    default: [
      "/images/tomato.jpg", // Placeholder - replace with generic tree images
      "/images/ridge-gourd.jpg", // Placeholder - replace with generic tree images
    ],
  };

  // Create variety-specific image mappings
  const varietyImageMap = {
    // Mango varieties (handle different spellings)
    "alpanso mango": [
      "/images/trees/mango/varieties/alpanso-1.jpeg",
      "/images/trees/mango/varieties/alpanso-2.webp",
      "/images/trees/mango/varieties/alpanso-3.jpg",
    ],
    "kesar mango": [
      "/images/trees/mango/varieties/kesar-1.jpg",
      "/images/trees/mango/varieties/kesar-2.jpg",
      "/images/trees/mango/varieties/kesar-3.jpg",
    ],
    "totapuri mango": [
      "/images/trees/mango/varieties/totapuri-1.jpg",
      "/images/trees/mango/varieties/totapuri-2.jpg",
      "/images/trees/mango/varieties/totapuri-3.jpg",
    ],
    "dasheri mango": [
      "/images/trees/mango/varieties/dasheri-1.jpg",
      "/images/trees/mango/varieties/dasheri-2.jpg",
      "/images/trees/mango/varieties/dasheri-3.jpg",
    ],

    // Guava varieties
    "taiwan pink guava": [
      "/images/trees/guava/varieties/taiwan-pink-1.jpg",
      "/images/trees/guava/varieties/taiwan-pink-2.jpg",
      "/images/trees/guava/varieties/taiwan-pink-3.jpg",
    ],
    "apple guava": [
      "/images/trees/guava/varieties/apple-guava-1.jpg",
      "/images/trees/guava/varieties/apple-guava-2.jpg",
      "/images/trees/guava/varieties/apple-guava-3.jpg",
    ],
    "allahabad guava": [
      "/images/trees/guava/varieties/allahabad-1.jpg",
      "/images/trees/guava/varieties/allahabad-2.jpg",
      "/images/trees/guava/varieties/allahabad-3.jpg",
    ],

    // Lemon varieties
    "sweet lemon": [
      "/images/trees/lemon/varieties/sweet-lemon-1.jpg",
      "/images/trees/lemon/varieties/sweet-lemon-2.jpg",
      "/images/trees/lemon/varieties/sweet-lemon-3.jpg",
    ],
    "kagzi lemon": [
      "/images/trees/lemon/varieties/kagzi-1.jpg",
      "/images/trees/lemon/varieties/kagzi-2.jpg",
      "/images/trees/lemon/varieties/kagzi-3.jpg",
    ],
  };

  // Get images based on variety first, then tree type
  const baseTreeName = treeName.toLowerCase();
  let selectedImages;

  if (variety) {
    // Try variety-specific images first
    const varietyKey = `${variety.toLowerCase()} ${baseTreeName}`;
    console.log("Looking for variety images with key:", varietyKey);
    console.log("Available variety keys:", Object.keys(varietyImageMap));
    selectedImages = varietyImageMap[varietyKey];

    console.log("Found variety images:", selectedImages);

    // If no variety-specific images, fall back to base tree images
    if (!selectedImages || selectedImages.length === 0) {
      console.log("No variety images found, falling back to base tree images");
      selectedImages = treeImageMap[baseTreeName] || treeImageMap.default;
    }
  } else {
    // No variety specified, use base tree images
    console.log(
      "No variety specified, using base tree images for:",
      baseTreeName
    );
    selectedImages = treeImageMap[baseTreeName] || treeImageMap.default;
  }

  return selectedImages;
};

export default function TreeDetails({ tree }) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState(new Set());

  // Get tree images from online sources
  const treeImages = getTreeImages(tree);

  // Debug logging (remove when working)
  // console.log("Tree details:", {
  //   name: tree.name,
  //   variety: tree.variety,
  //   base_tree_name: tree.base_tree_name,
  //   images: treeImages,
  // });

  // Filter out failed images
  const availableImages = treeImages.filter(
    (_, index) => !imageErrors.has(index)
  );

  const handleImageError = (index) => {
    console.log(`Image failed to load at index ${index}:`, treeImages[index]);
    setImageErrors((prev) => new Set([...prev, index]));

    // If current image fails and it's the selected one, move to next available
    if (index === selectedImageIndex) {
      const remainingImages = treeImages.filter(
        (_, i) => !imageErrors.has(i) && i !== index
      );
      if (remainingImages.length > 0) {
        // Find the next available image index
        const nextAvailableIndex = treeImages.findIndex(
          (_, i) => !imageErrors.has(i) && i !== index
        );
        if (nextAvailableIndex !== -1) {
          setSelectedImageIndex(nextAvailableIndex);
        }
      }
    }
  };

  if (!tree) {
    router.push("/farm-dashboard");
    return null;
  }

  const benefits = getTreeBenefits(tree);
  const careTips = getCareTips(tree);
  const superfood = isSuperfood(tree);

  return (
    <Container className="py-4">
      <style>{`
        .tree-gallery .btn:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        .tree-gallery .cursor-pointer:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        .tree-gallery img {
          transition: opacity 0.3s ease;
        }
        
        .tree-carousel {
          background-color: #f8f9fa !important;
          height: 450px;
          border-radius: 1rem;
          overflow: hidden;
        }
        
        .tree-carousel .carousel-inner {
          background-color: #f8f9fa;
          border-radius: 1rem;
          overflow: hidden;
          height: 100%;
        }
        
        .tree-carousel .carousel-item {
          background-color: #f8f9fa;
        }
        
        .custom-carousel-btn {
          opacity: 0.6;
          transition: all 0.3s ease;
        }
        
        .tree-carousel:hover .custom-carousel-btn {
          opacity: 1;
        }
        
        .custom-carousel-btn:hover {
          opacity: 1 !important;
          transform: scale(1.1);
          background-color: rgba(0, 0, 0, 0.8) !important;
        }
        
        .info-card {
          border-radius: 10px !important;
          transition: all 0.2s ease;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05) !important;
        }
        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        .superfood-badge {
          background: linear-gradient(45deg, #ff6b6b, #feca57);
          color: white;
          font-weight: bold;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .benefit-item {
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          color: #1976d2;
          border: 1px solid #e1f5fe;
          border-radius: 20px;
          padding: 8px 16px;
          margin: 4px;
          display: inline-block;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .benefit-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          background: linear-gradient(135deg, #bbdefb 0%, #e1bee7 100%);
        }
        
        .care-tip {
          background-color: #e8f5e8;
          border-left: 4px solid #28a745;
          padding: 12px;
          margin: 8px 0;
          border-radius: 0 8px 8px 0;
        }
      `}</style>

      <Row className="g-4">
        <Col lg={6}>
          {/* Tree Image Gallery */}
          <div className="tree-gallery">
            <div className="position-relative rounded-4 overflow-hidden shadow-sm mb-3">
              {availableImages && availableImages.length > 0 ? (
                <Carousel
                  activeIndex={selectedImageIndex}
                  onSelect={(selectedIndex) => {
                    setSelectedImageIndex(selectedIndex);
                  }}
                  interval={null}
                  touch={true}
                  slide={true}
                  fade={false}
                  controls={false}
                  indicators={false}
                  className="tree-carousel"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  {availableImages.map((image, index) => (
                    <Carousel.Item key={index} className="h-100">
                      <div
                        className="d-block w-100 position-relative h-100"
                        style={{ height: "450px", backgroundColor: "#f8f9fa" }}
                      >
                        <Image
                          src={image}
                          alt={`${tree.variety || tree.name} - Image ${
                            index + 1
                          }`}
                          fill
                          style={{ objectFit: "cover" }}
                          className="rounded-4"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority={index === 0}
                          onError={() =>
                            handleImageError(treeImages.indexOf(image))
                          }
                        />
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center bg-light rounded-4"
                  style={{ height: "450px" }}
                >
                  <div className="text-center text-muted">
                    <div style={{ fontSize: "4rem" }}>
                      {getTreeCategoryIcon(tree.category)}
                    </div>
                    <p className="mt-2">No image available</p>
                    <small className="text-muted">
                      {tree.variety
                        ? `${tree.variety} ${tree.base_tree_name || "Tree"}`
                        : tree.name}
                    </small>
                  </div>
                </div>
              )}

              {/* Image Counter Badge */}
              {availableImages && availableImages.length > 1 && (
                <div
                  className="position-absolute top-0 end-0 m-3 px-2 py-1 rounded-pill text-white"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    fontSize: "0.85rem",
                    zIndex: 15,
                  }}
                >
                  {selectedImageIndex + 1} / {availableImages.length}
                </div>
              )}

              {/* Custom Navigation Controls */}
              {availableImages && availableImages.length > 1 && (
                <>
                  <button
                    className="position-absolute top-50 start-0 translate-middle-y ms-2 btn p-0 custom-carousel-btn"
                    onClick={() => {
                      const newIndex =
                        selectedImageIndex > 0
                          ? selectedImageIndex - 1
                          : availableImages.length - 1;
                      setSelectedImageIndex(newIndex);
                    }}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: "50%",
                      width: "50px",
                      height: "50px",
                      border: "none",
                      zIndex: 10,
                    }}
                  >
                    <i
                      className="ti-angle-left text-white"
                      style={{ fontSize: "20px" }}
                    ></i>
                  </button>

                  <button
                    className="position-absolute top-50 end-0 translate-middle-y me-2 btn p-0 custom-carousel-btn"
                    onClick={() => {
                      const newIndex =
                        selectedImageIndex < availableImages.length - 1
                          ? selectedImageIndex + 1
                          : 0;
                      setSelectedImageIndex(newIndex);
                    }}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: "50%",
                      width: "50px",
                      height: "50px",
                      border: "none",
                      zIndex: 10,
                    }}
                  >
                    <i
                      className="ti-angle-right text-white"
                      style={{ fontSize: "20px" }}
                    ></i>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {availableImages && availableImages.length > 1 && (
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                {availableImages.map((image, index) => (
                  <div
                    key={index}
                    className={`position-relative rounded-2 overflow-hidden cursor-pointer ${
                      selectedImageIndex === index ? "ring-2 ring-success" : ""
                    }`}
                    style={{
                      width: "70px",
                      height: "70px",
                      border:
                        selectedImageIndex === index
                          ? "2px solid #28a745"
                          : "2px solid transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedImageIndex(index);
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${tree.variety || tree.name} thumbnail ${
                        index + 1
                      }`}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-2"
                      sizes="70px"
                      onError={() =>
                        handleImageError(treeImages.indexOf(image))
                      }
                    />
                    {/* Overlay for non-selected images */}
                    {selectedImageIndex !== index && (
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100 rounded-2"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>

        <Col lg={6}>
          <div className="sticky-lg-top">
            {/* Title and Category */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h1 className="mb-2 fw-bold d-flex align-items-center">
                  <span className="me-2" style={{ fontSize: "2rem" }}>
                    {getTreeCategoryIcon(tree.category)}
                  </span>
                  {tree.variety
                    ? `${tree.variety} ${tree.base_tree_name || "Mango"}`
                    : tree.name}
                </h1>
                {tree.variety && (
                  <small className="text-muted">
                    Variety of {tree.base_tree_name || "Mango"}
                  </small>
                )}
                <div className="d-flex gap-2 flex-wrap mt-2">
                  <Badge
                    bg={getSeasonBadgeColor(tree.season)}
                    className="fs-6 px-3 py-2"
                  >
                    {tree.season || "Year-round"}
                  </Badge>
                  {superfood && (
                    <Badge className="fs-6 px-3 py-2 superfood-badge">
                      ⭐ Superfood
                    </Badge>
                  )}
                </div>
              </div>
              <Badge
                className="fs-5 px-3 py-2"
                style={{
                  backgroundColor: "#6f42c1",
                  color: "white",
                  borderRadius: "8px",
                  fontWeight: "600",
                }}
              >
                {tree.code}
              </Badge>
            </div>

            {/* Description */}
            {tree.description && (
              <div className="mb-4 px-1">
                <OffcanvasDescription
                  description={tree.description}
                  title={tree.name}
                  maxLines={3}
                  charactersPerLine={85}
                />
              </div>
            )}

            {/* Quick Info Cards */}
            <Row className="g-3 mb-4">
              <Col xs={6} lg={6}>
                <Card className="border-0 bg-light h-100 info-card">
                  <Card.Body className="d-flex align-items-center p-3">
                    <i className="ti-tag fs-4 me-3 text-primary"></i>
                    <div>
                      <div className="text-muted small">Category</div>
                      <div className="fw-semibold text-capitalize">
                        {tree.category || "General"}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} lg={6}>
                <Card className="border-0 bg-light h-100 info-card">
                  <Card.Body className="d-flex align-items-center p-3">
                    <i className="ti-calendar fs-4 me-3 text-warning"></i>
                    <div>
                      <div className="text-muted small">Years to Fruit</div>
                      <div className="fw-semibold">
                        {tree.years_to_fruit || "2-3"} years
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} lg={6}>
                <Card className="border-0 bg-light h-100 info-card">
                  <Card.Body className="d-flex align-items-center p-3">
                    <i className="ti-ruler fs-4 me-3 text-info"></i>
                    <div>
                      <div className="text-muted small">Mature Height</div>
                      <div className="fw-semibold">
                        {tree.mature_height || "Medium (10-20 ft)"}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} lg={6}>
                <Card className="border-0 bg-light h-100 info-card">
                  <Card.Body className="d-flex align-items-center p-3">
                    <i className="ti-leaf fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Season</div>
                      <div className="fw-semibold text-capitalize">
                        {tree.season || "Year-round"}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Benefits Section */}
            {benefits.length > 0 && (
              <Card className="border-0 bg-light mb-4">
                <Card.Body>
                  <h5 className="mb-3 d-flex align-items-center">
                    <i className="ti-heart fs-4 me-2 text-danger"></i>
                    Health Benefits
                  </h5>
                  <div>
                    {benefits.map((benefit, index) => (
                      <span key={index} className="benefit-item">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Care Tips Section */}
            <Card className="border-0 bg-light mb-4">
              <Card.Body>
                <h5 className="mb-3 d-flex align-items-center">
                  <i className="ti-settings fs-4 me-2 text-primary"></i>
                  Care Tips
                </h5>
                {careTips.map((tip, index) => (
                  <div key={index} className="care-tip">
                    <i className="ti-check text-success me-2"></i>
                    {tip}
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Tree Positions */}
            {tree.tree_positions && tree.tree_positions.length > 0 && (
              <Card className="border-0 bg-light mb-4">
                <Card.Body>
                  <h5 className="mb-3 d-flex align-items-center">
                    <i className="ti-location-pin fs-4 me-2 text-info"></i>
                    Planted Locations
                  </h5>
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Layout</th>
                          <th>Position</th>
                          <th>Variety</th>
                          <th>Status</th>
                          <th>Planted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tree.tree_positions.map((position, index) => (
                          <tr key={index}>
                            <td>{position.farm_layouts?.name || "Unknown"}</td>
                            <td>
                              Block {position.block_index + 1}, (
                              {position.grid_x}, {position.grid_y})
                            </td>
                            <td>{position.variety || tree.name}</td>
                            <td>
                              <Badge bg={getStatusBadgeColor(position.status)}>
                                {position.status || "healthy"}
                              </Badge>
                            </td>
                            <td>
                              {position.planting_date
                                ? new Date(
                                    position.planting_date
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="d-grid gap-2">
              <Button
                variant="outline-primary"
                size="lg"
                onClick={() => router.push("/tree-management")}
              >
                <i className="ti-arrow-left me-2"></i>
                Back to Tree Management
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
