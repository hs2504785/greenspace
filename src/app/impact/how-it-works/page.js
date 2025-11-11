"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Accordion,
  Button,
} from "react-bootstrap";
import { useRouter } from "next/navigation";
import {
  FaLeaf,
  FaTree,
  FaSeedling,
  FaRecycle,
  FaTint,
  FaBoxOpen,
  FaHandHoldingHeart,
  FaUsers,
  FaShoppingCart,
  FaCalendar,
  FaBook,
  FaArrowLeft,
  FaCheckCircle,
  FaTrophy,
  FaLightbulb,
} from "react-icons/fa";

export default function HowItWorksPage() {
  const router = useRouter();

  const impactCategories = [
    {
      id: "carbon-credits",
      icon: <FaLeaf className="text-success" size={32} />,
      title: "Carbon Credits (kg CO₂ Saved)",
      color: "success",
      description: "Reduce your carbon footprint through sustainable practices",
      howToImpact: [
        {
          action: "Buy Local Produce",
          points: "2.5 kg CO₂ per kg",
          explanation: "Local food travels less distance, saving transportation emissions",
          automatic: true,
        },
        {
          action: "Sell Local Produce",
          points: "2.5 kg CO₂ per kg sold",
          explanation: "Help others reduce their carbon footprint by providing local alternatives",
          automatic: true,
        },
        {
          action: "Plant Trees",
          points: "2.5 kg CO₂ per tree/year",
          explanation: "Trees absorb CO₂ from the atmosphere",
          automatic: false,
        },
        {
          action: "Compost Organic Waste",
          points: "0.5 kg CO₂ per kg composted",
          explanation: "Reduces methane emissions from landfills",
          automatic: false,
        },
      ],
      tips: [
        "Choose locally grown vegetables over store-bought",
        "Start composting kitchen waste",
        "Plant native trees in your garden",
        "Reduce food waste by buying what you need",
      ],
    },
    {
      id: "trees-planted",
      icon: <FaTree className="text-success" size={32} />,
      title: "Trees Planted",
      color: "success",
      description: "Contribute to reforestation and biodiversity",
      howToImpact: [
        {
          action: "Plant Fruit Trees",
          points: "1 tree + 50 points",
          explanation: "Provides food, oxygen, and habitat for wildlife",
          automatic: false,
        },
        {
          action: "Plant Native Trees",
          points: "1 tree + 50 points",
          explanation: "Supports local ecosystems and biodiversity",
          automatic: false,
        },
        {
          action: "Organize Tree Planting Events",
          points: "Multiple trees + bonus points",
          explanation: "Mobilize community for larger impact",
          automatic: false,
        },
      ],
      tips: [
        "Start with easy-to-grow native species",
        "Plant during monsoon season for better survival",
        "Involve family and neighbors in planting drives",
        "Document your plantings with photos",
      ],
    },
    {
      id: "seeds-shared",
      icon: <FaSeedling className="text-info" size={32} />,
      title: "Seeds Shared",
      color: "info",
      description: "Preserve biodiversity and traditional crop varieties",
      howToImpact: [
        {
          action: "Share Heirloom Seeds",
          points: "25 points per variety",
          explanation: "Preserve genetic diversity and traditional crops",
          automatic: true,
        },
        {
          action: "Exchange Seeds",
          points: "10 points received",
          explanation: "Build community seed bank and knowledge",
          automatic: true,
        },
        {
          action: "Save Seeds from Harvest",
          points: "Supports seed sharing",
          explanation: "Learn seed saving techniques and share surplus",
          automatic: false,
        },
      ],
      tips: [
        "Save seeds from your best performing plants",
        "Label seeds with variety name and date",
        "Store seeds in cool, dry place",
        "Join seed exchange groups in your area",
      ],
    },
    {
      id: "composting",
      icon: <FaRecycle className="text-success" size={32} />,
      title: "Organic Waste Composted",
      color: "success",
      description: "Convert waste into nutrient-rich soil amendment",
      howToImpact: [
        {
          action: "Kitchen Waste Composting",
          points: "2 points per kg",
          explanation: "Fruit peels, vegetable scraps, coffee grounds",
          automatic: false,
        },
        {
          action: "Garden Waste Composting",
          points: "2 points per kg",
          explanation: "Leaves, grass clippings, plant trimmings",
          automatic: false,
        },
        {
          action: "Set Up Community Compost",
          points: "Bonus points + multiplier",
          explanation: "Help neighbors compost collectively",
          automatic: false,
        },
      ],
      tips: [
        "Start with a small bin in your kitchen",
        "Balance green (nitrogen) and brown (carbon) materials",
        "Turn compost regularly for faster decomposition",
        "Use finished compost in your garden",
      ],
    },
    {
      id: "water-saved",
      icon: <FaTint className="text-info" size={32} />,
      title: "Water Saved",
      color: "info",
      description: "Conserve precious water resources",
      howToImpact: [
        {
          action: "Rainwater Harvesting",
          points: "0.1 points per liter",
          explanation: "Collect and store rainwater for irrigation",
          automatic: false,
        },
        {
          action: "Drip Irrigation",
          points: "Water saved vs traditional",
          explanation: "Efficient watering reduces waste",
          automatic: false,
        },
        {
          action: "Mulching",
          points: "Reduces evaporation",
          explanation: "Keeps soil moist longer",
          automatic: false,
        },
      ],
      tips: [
        "Install rain barrels to capture roof runoff",
        "Water plants early morning or evening",
        "Use mulch to retain soil moisture",
        "Choose drought-resistant native plants",
      ],
    },
    {
      id: "plastic-reduced",
      icon: <FaBoxOpen className="text-warning" size={32} />,
      title: "Plastic Reduced",
      color: "warning",
      description: "Minimize plastic waste and pollution",
      howToImpact: [
        {
          action: "Reusable Shopping Bags",
          points: "20 points per kg avoided",
          explanation: "Replace single-use plastic bags",
          automatic: false,
        },
        {
          action: "No Plastic Packaging",
          points: "Varies by amount",
          explanation: "Buy bulk, use containers, avoid packaged goods",
          automatic: false,
        },
        {
          action: "Plastic-Free Deliveries",
          points: "Bonus for sellers",
          explanation: "Pack orders without plastic materials",
          automatic: false,
        },
      ],
      tips: [
        "Carry reusable bags, bottles, and containers",
        "Buy loose vegetables instead of pre-packaged",
        "Use cloth bags for produce",
        "Support sellers who use eco-friendly packaging",
      ],
    },
    {
      id: "local-food",
      icon: <FaShoppingCart className="text-danger" size={32} />,
      title: "Local Food Purchased/Sold",
      color: "danger",
      description: "Support local farmers and reduce food miles",
      howToImpact: [
        {
          action: "Buy from Local Farmers",
          points: "3 points per kg + CO₂ credits",
          explanation: "Reduces transportation emissions and supports local economy",
          automatic: true,
        },
        {
          action: "Sell Your Produce",
          points: "15 points per sale",
          explanation: "Become a local food provider",
          automatic: true,
        },
        {
          action: "Join Community Supported Agriculture",
          points: "Regular impact",
          explanation: "Commit to local seasonal produce",
          automatic: false,
        },
      ],
      tips: [
        "Shop at local farmers' markets",
        "Join or start a local food buying group",
        "Choose seasonal vegetables",
        "Connect with nearby farmers on our platform",
      ],
    },
    {
      id: "volunteer-hours",
      icon: <FaHandHoldingHeart className="text-danger" size={32} />,
      title: "Volunteer Hours",
      color: "danger",
      description: "Give your time to community initiatives",
      howToImpact: [
        {
          action: "Community Garden Work",
          points: "20 points per hour",
          explanation: "Help maintain shared growing spaces",
          automatic: false,
        },
        {
          action: "Farm Work Days",
          points: "20 points per hour",
          explanation: "Assist local farmers during busy seasons",
          automatic: false,
        },
        {
          action: "Event Organization",
          points: "Hours + event points",
          explanation: "Plan and execute community events",
          automatic: false,
        },
      ],
      tips: [
        "Start with 2-3 hours per month",
        "Bring friends and family to volunteer together",
        "Learn farming skills while helping",
        "Document hours for impact tracking",
      ],
    },
    {
      id: "events",
      icon: <FaCalendar className="text-primary" size={32} />,
      title: "Events Organized/Attended",
      color: "primary",
      description: "Build community through shared experiences",
      howToImpact: [
        {
          action: "Organize Workshops",
          points: "50 points per event",
          explanation: "Teach sustainable farming practices",
          automatic: false,
        },
        {
          action: "Attend Farm Visits",
          points: "15-20 points",
          explanation: "Learn from other farmers",
          automatic: true,
        },
        {
          action: "Host Seed Swaps",
          points: "Event + seed points",
          explanation: "Facilitate seed exchange gatherings",
          automatic: false,
        },
        {
          action: "Community Celebrations",
          points: "Varies",
          explanation: "Harvest festivals, potlucks, etc.",
          automatic: false,
        },
      ],
      tips: [
        "Start small with backyard workshops",
        "Collaborate with other community members",
        "Use our platform to promote events",
        "Document and share event learnings",
      ],
    },
    {
      id: "knowledge-sharing",
      icon: <FaBook className="text-primary" size={32} />,
      title: "Knowledge Sharing",
      color: "primary",
      description: "Educate and empower the community",
      howToImpact: [
        {
          action: "Write Growing Guides",
          points: "100 points per guide",
          explanation: "Share your expertise in detailed guides",
          automatic: false,
        },
        {
          action: "Conduct Workshops",
          points: "75 points per workshop",
          explanation: "Hands-on teaching sessions",
          automatic: false,
        },
        {
          action: "Answer Questions",
          points: "15 points per answer",
          explanation: "Help others solve farming challenges",
          automatic: false,
        },
        {
          action: "Create Video Tutorials",
          points: "Bonus points",
          explanation: "Visual learning resources",
          automatic: false,
        },
      ],
      tips: [
        "Share what you know, even if it seems basic",
        "Document your successes and failures",
        "Use photos to illustrate your points",
        "Respond to community questions regularly",
      ],
    },
  ];

  const impactLevels = [
    {
      level: "Green Starter",
      points: "0 - 499",
      icon: <FaSeedling />,
      color: "secondary",
      description: "Beginning your sustainability journey",
    },
    {
      level: "Eco Contributor",
      points: "500 - 1,999",
      icon: <FaLeaf />,
      color: "info",
      description: "Making regular positive impact",
    },
    {
      level: "Green Warrior",
      points: "2,000 - 4,999",
      icon: <FaTrophy />,
      color: "success",
      description: "Dedicated environmental advocate",
    },
    {
      level: "Sustainability Leader",
      points: "5,000 - 9,999",
      icon: <FaTrophy />,
      color: "warning",
      description: "Inspiring others through action",
    },
    {
      level: "Environmental Champion",
      points: "10,000+",
      icon: <FaTrophy />,
      color: "danger",
      description: "Ultimate impact maker",
    },
  ];

  return (
    <Container className="py-4" style={{ maxWidth: "1200px" }}>
      {/* Back Button */}
      <Button
        variant="outline-secondary"
        size="sm"
        className="mb-3"
        onClick={() => router.push("/impact")}
      >
        <FaArrowLeft className="me-2" />
        Back to Dashboard
      </Button>

      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-2">
          <FaLightbulb className="text-warning me-3" size={40} />
          <h1 className="mb-0">How Impact Tracking Works</h1>
        </div>
        <p className="lead text-muted">
          Learn how each action contributes to your environmental impact score and helps build a sustainable community
        </p>
      </div>

      {/* Quick Summary */}
      <Card className="border-0 shadow-sm mb-4 bg-light">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5 className="fw-bold mb-3">
                <FaCheckCircle className="text-success me-2" />
                Tracked Automatically
              </h5>
              <ul className="mb-0">
                <li>Product purchases and sales</li>
                <li>Seed exchanges completed</li>
                <li>Farm visits attended</li>
                <li>Orders completed</li>
              </ul>
            </Col>
            <Col md={6}>
              <h5 className="fw-bold mb-3">
                <FaUsers className="text-primary me-2" />
                Log Manually (Coming Soon)
              </h5>
              <ul className="mb-0">
                <li>Trees planted</li>
                <li>Composting activities</li>
                <li>Water conservation</li>
                <li>Workshops conducted</li>
                <li>Volunteer hours</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Impact Categories */}
      <h3 className="mb-4">Impact Categories Explained</h3>
      <Accordion defaultActiveKey="0" className="mb-5">
        {impactCategories.map((category, index) => (
          <Accordion.Item eventKey={index.toString()} key={category.id}>
            <Accordion.Header>
              <div className="d-flex align-items-center w-100">
                <div className="me-3">{category.icon}</div>
                <div className="flex-grow-1">
                  <strong>{category.title}</strong>
                  <br />
                  <small className="text-muted">{category.description}</small>
                </div>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <h6 className="fw-bold mb-3">How to Make an Impact:</h6>
              
              {category.howToImpact.map((action, idx) => (
                <Card key={idx} className="mb-3 border-start border-4" style={{ borderColor: `var(--bs-${category.color})` }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">
                          {action.action}
                          {action.automatic && (
                            <Badge bg="success" className="ms-2 small">
                              Auto-tracked
                            </Badge>
                          )}
                        </h6>
                        <p className="text-muted small mb-0">{action.explanation}</p>
                      </div>
                      <Badge bg={category.color} className="ms-2">
                        {action.points}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              ))}

              <div className="bg-light p-3 rounded mt-3">
                <h6 className="fw-bold mb-2">
                  <FaLightbulb className="text-warning me-2" />
                  Practical Tips:
                </h6>
                <ul className="mb-0">
                  {category.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      {/* Impact Levels */}
      <h3 className="mb-4">Impact Levels & Recognition</h3>
      <Row className="g-3 mb-4">
        {impactLevels.map((level, index) => (
          <Col key={index} xs={12} md={6} lg={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className={`text-${level.color} mb-3`} style={{ fontSize: "2.5rem" }}>
                  {level.icon}
                </div>
                <h5 className="fw-bold">{level.level}</h5>
                <Badge bg={level.color} className="mb-2">
                  {level.points} points
                </Badge>
                <p className="text-muted small mb-0">{level.description}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Call to Action */}
      <Card className="border-0 shadow-sm bg-success text-white">
        <Card.Body className="text-center py-4">
          <h4 className="fw-bold mb-3">Ready to Make an Impact?</h4>
          <p className="mb-4">
            Every small action counts. Start today and watch your impact grow!
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Button
              variant="light"
              size="lg"
              onClick={() => router.push("/")}
            >
              <FaShoppingCart className="me-2" />
              Shop Local Produce
            </Button>
            <Button
              variant="outline-light"
              size="lg"
              onClick={() => router.push("/seeds")}
            >
              <FaSeedling className="me-2" />
              Exchange Seeds
            </Button>
            <Button
              variant="outline-light"
              size="lg"
              onClick={() => router.push("/impact")}
            >
              <FaTrophy className="me-2" />
              View Dashboard
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* FAQ Section */}
      <Card className="border-0 shadow-sm mt-4">
        <Card.Header className="bg-white border-bottom">
          <h5 className="mb-0">Frequently Asked Questions</h5>
        </Card.Header>
        <Card.Body>
          <h6 className="fw-bold">How are carbon credits calculated?</h6>
          <p className="text-muted">
            We estimate 2.5 kg CO₂ saved per kg of local produce based on reduced transportation emissions compared to store-bought alternatives from distant sources.
          </p>

          <h6 className="fw-bold mt-3">Why are some activities tracked automatically?</h6>
          <p className="text-muted">
            Activities completed through our platform (purchases, sales, seed exchanges) are automatically tracked for accuracy and transparency.
          </p>

          <h6 className="fw-bold mt-3">Can I log past activities?</h6>
          <p className="text-muted">
            Manual activity logging is coming soon! You'll be able to record tree plantings, composting, and other activities with admin verification.
          </p>

          <h6 className="fw-bold mt-3">How do I climb to higher impact levels?</h6>
          <p className="text-muted">
            Stay active in the community, complete purchases from local farmers, share seeds, attend events, and contribute knowledge. Consistency is key!
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}

