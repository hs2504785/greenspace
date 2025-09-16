"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Form,
  InputGroup,
  Modal,
  Tabs,
  Tab,
  Alert,
} from "react-bootstrap";
import {
  FaSearch,
  FaFilter,
  FaTree,
  FaLeaf,
  FaSeedling,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaClock,
  FaRuler,
  FaTint,
  FaSun,
} from "react-icons/fa";
import { PLANT_TYPES, REGIONS, SEASONS } from "@/data/sevenLayerPlants";

const ComprehensivePlantList = ({ layerData, layerNumber }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showPlantModal, setShowPlantModal] = useState(false);

  // Safety check for layerData
  if (!layerData || !layerData.allPlants) {
    return (
      <Alert variant="warning">
        <FaInfoCircle className="me-2" />
        No plant data available for this layer.
      </Alert>
    );
  }

  const allPlants = layerData.allPlants || [];

  // Filter plants based on search criteria
  const filteredPlants = allPlants.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.hindi_name.includes(searchTerm) ||
      plant.scientific_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || plant.type === selectedType;
    const matchesRegion =
      !selectedRegion || plant.regions.includes(selectedRegion);
    const matchesCategory =
      !selectedCategory || plant.category === selectedCategory;

    return matchesSearch && matchesType && matchesRegion && matchesCategory;
  });

  // Get unique categories for this layer
  const uniqueCategories = [
    ...new Set(allPlants.map((plant) => plant.category)),
  ];
  const uniqueTypes = [...new Set(allPlants.map((plant) => plant.type))];

  const getPlantIcon = (plant) => {
    if (!plant || !plant.type) {
      return <FaLeaf className="text-secondary" />;
    }

    switch (plant.type) {
      case PLANT_TYPES.TREE:
      case PLANT_TYPES.FRUIT_TREE:
      case PLANT_TYPES.NUT_TREE:
        return <FaTree className="text-success" />;
      case PLANT_TYPES.SHRUB:
      case PLANT_TYPES.BERRY:
        return <FaLeaf className="text-primary" />;
      case PLANT_TYPES.HERB:
      case PLANT_TYPES.SPICE:
      case PLANT_TYPES.MEDICINAL:
        return <FaSeedling className="text-info" />;
      default:
        return <FaLeaf className="text-secondary" />;
    }
  };

  const getTypeColor = (type) => {
    if (!type) {
      return "secondary";
    }

    switch (type) {
      case PLANT_TYPES.FRUIT_TREE:
        return "success";
      case PLANT_TYPES.NUT_TREE:
        return "warning";
      case PLANT_TYPES.VEGETABLE:
        return "primary";
      case PLANT_TYPES.HERB:
        return "info";
      case PLANT_TYPES.SPICE:
        return "warning";
      case PLANT_TYPES.VINE:
        return "secondary";
      case PLANT_TYPES.GROUND_COVER:
        return "success";
      case PLANT_TYPES.ROOT_VEGETABLE:
        return "danger";
      default:
        return "secondary";
    }
  };

  const getCategoryBadgeColor = (category) => {
    if (!category) {
      return "light";
    }

    switch (category) {
      case "fruit":
        return "success";
      case "vegetable":
        return "primary";
      case "herb":
        return "info";
      case "spice":
        return "warning";
      case "nuts":
        return "secondary";
      case "timber":
        return "dark";
      case "medicinal":
        return "danger";
      default:
        return "light";
    }
  };

  // Function to search for matching tree by name
  const findMatchingTree = async (plantName) => {
    try {
      const response = await fetch("/api/trees");
      if (response.ok) {
        const trees = await response.json();
        // Try to find a tree that matches the plant name
        const matchingTree = trees.find(
          (tree) =>
            tree.name.toLowerCase().includes(plantName.toLowerCase()) ||
            plantName.toLowerCase().includes(tree.name.toLowerCase())
        );
        return matchingTree;
      }
    } catch (error) {
      console.error("Error searching for matching tree:", error);
    }
    return null;
  };

  // Function to handle card click (navigate to tree details or show modal)
  const handleCardClick = async (plant) => {
    const matchingTree = await findMatchingTree(plant.name);

    if (matchingTree && matchingTree.id) {
      // Navigate to tree details page
      router.push(`/trees/${matchingTree.id}`);
    } else {
      // Fallback to plant details modal
      handlePlantModalClick(plant);
    }
  };

  // Function to handle "View Details" button click (always show modal)
  const handlePlantModalClick = (plant) => {
    setSelectedPlant(plant);
    setShowPlantModal(true);
  };

  return (
    <div className="comprehensive-plant-list">
      {/* Search and Filter Section */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <FaFilter className="me-2" />
            Layer {layerNumber}: {layerData.name} - {allPlants.length} Plants
            Available
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search plants (English, Hindi, Scientific name)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="">All Regions</option>
                {Object.values(REGIONS).map((region) => (
                  <option key={region} value={region}>
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {filteredPlants.length !== allPlants.length && (
            <Alert variant="info" className="mt-3">
              <FaInfoCircle className="me-2" />
              Showing {filteredPlants.length} of {allPlants.length} plants
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Plants Grid */}
      <Row className="g-3">
        {filteredPlants.map((plant, index) => {
          // Safety check for plant data
          if (!plant || !plant.name) {
            return null;
          }

          return (
            <Col key={index} sm={6} md={4} lg={3}>
              <Card className="h-100 plant-card">
                {/* Clickable card content */}
                <div
                  className="card-clickable-area"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick(plant)}
                >
                  <Card.Header className="pb-2">
                    <div className="d-flex justify-content-between align-items-start">
                      {getPlantIcon(plant)}
                      <Badge bg={getTypeColor(plant.type)} className="ms-2">
                        {plant.type ? plant.type.replace(/_/g, " ") : "Unknown"}
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body className="pt-2">
                    <h6 className="card-title mb-1">
                      {plant.name || "Unknown Plant"}
                    </h6>
                    <p className="text-muted small mb-2">
                      {plant.hindi_name || ""}
                    </p>
                    <p
                      className="small text-secondary mb-2"
                      style={{ fontSize: "0.8em" }}
                    >
                      <em>{plant.scientific_name || ""}</em>
                    </p>

                    <div className="mb-2">
                      <Badge
                        bg={getCategoryBadgeColor(plant.category)}
                        className="me-1"
                      >
                        {plant.category || "uncategorized"}
                      </Badge>
                      <Badge bg="light" text="dark">
                        {plant.height_range || "Unknown height"}
                      </Badge>
                    </div>

                    <div className="small text-muted">
                      <div className="mb-1">
                        <FaRuler className="me-1" />{" "}
                        {plant.spacing || "Unknown spacing"}
                      </div>
                      <div className="mb-1">
                        <FaClock className="me-1" />{" "}
                        {plant.years_to_harvest || "?"}yr to harvest
                      </div>
                      <div>
                        <FaMapMarkerAlt className="me-1" />
                        {plant.regions && plant.regions.length > 0
                          ? plant.regions
                              .slice(0, 2)
                              .map(
                                (region) =>
                                  region.charAt(0).toUpperCase() +
                                  region.slice(1)
                              )
                              .join(", ")
                          : "Unknown region"}
                        {plant.regions && plant.regions.length > 2 && "..."}
                      </div>
                    </div>
                  </Card.Body>
                </div>

                {/* Separate button area */}
                <Card.Footer className="text-center">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handlePlantModalClick(plant);
                    }}
                  >
                    View Details
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>

      {filteredPlants.length === 0 && (
        <Alert variant="warning" className="text-center">
          <FaInfoCircle className="me-2" />
          No plants found matching your criteria. Try adjusting your filters.
        </Alert>
      )}

      {/* Plant Detail Modal */}
      <Modal
        show={showPlantModal}
        onHide={() => setShowPlantModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {getPlantIcon(selectedPlant)} {selectedPlant?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlant && (
            <Tabs defaultActiveKey="overview">
              <Tab eventKey="overview" title="Overview">
                <div className="mt-3">
                  <Row>
                    <Col md={6}>
                      <h6>Basic Information</h6>
                      <p>
                        <strong>Hindi Name:</strong> {selectedPlant.hindi_name}
                      </p>
                      <p>
                        <strong>Scientific Name:</strong>{" "}
                        <em>{selectedPlant.scientific_name}</em>
                      </p>
                      <p>
                        <strong>Type:</strong>{" "}
                        <Badge bg={getTypeColor(selectedPlant.type)}>
                          {selectedPlant.type.replace(/_/g, " ")}
                        </Badge>
                      </p>
                      <p>
                        <strong>Category:</strong>{" "}
                        <Badge
                          bg={getCategoryBadgeColor(selectedPlant.category)}
                        >
                          {selectedPlant.category}
                        </Badge>
                      </p>
                      <p>
                        <strong>Height Range:</strong>{" "}
                        {selectedPlant.height_range}
                      </p>
                    </Col>
                    <Col md={6}>
                      <h6>Growing Requirements</h6>
                      <p>
                        <FaRuler className="me-2" />
                        <strong>Spacing:</strong> {selectedPlant.spacing}
                      </p>
                      <p>
                        <FaTint className="me-2" />
                        <strong>Water Needs:</strong>{" "}
                        {selectedPlant.water_needs}
                      </p>
                      <p>
                        <FaSun className="me-2" />
                        <strong>Sun Requirements:</strong>{" "}
                        {selectedPlant.sun_requirements}
                      </p>
                      <p>
                        <strong>Soil:</strong> {selectedPlant.soil_requirements}
                      </p>
                      <p>
                        <FaClock className="me-2" />
                        <strong>Time to Harvest:</strong>{" "}
                        {selectedPlant.years_to_harvest} year(s)
                      </p>
                    </Col>
                  </Row>
                </div>
              </Tab>
              <Tab eventKey="benefits" title="Benefits">
                <div className="mt-3">
                  <h6>Key Benefits</h6>
                  <ul>
                    {selectedPlant?.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>

                  <h6 className="mt-4">Suitable Regions</h6>
                  <div>
                    {selectedPlant?.regions.map((region, index) => (
                      <Badge
                        key={index}
                        bg="light"
                        text="dark"
                        className="me-2 mb-2"
                      >
                        {region.charAt(0).toUpperCase() + region.slice(1)}
                      </Badge>
                    ))}
                  </div>

                  <h6 className="mt-4">Harvest Seasons</h6>
                  <div>
                    {selectedPlant?.harvest_season.map((season, index) => (
                      <Badge key={index} bg="success" className="me-2 mb-2">
                        {season.charAt(0).toUpperCase() + season.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .plant-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          border: 1px solid #dee2e6;
        }
        .plant-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: #007bff;
        }
        .card-clickable-area {
          transition: background-color 0.2s ease-in-out;
        }
        .card-clickable-area:hover {
          background-color: rgba(0, 123, 255, 0.05);
        }
        .plant-card .card-footer {
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
        }
      `}</style>
    </div>
  );
};

export default ComprehensivePlantList;
