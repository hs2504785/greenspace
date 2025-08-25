"use client";

import { useState } from "react";
import {
  Modal,
  Form,
  Button,
  Row,
  Col,
  Card,
  Badge,
  Alert,
  ProgressBar,
  ButtonGroup,
} from "react-bootstrap";
import toastService from "@/utils/toastService";

const RATING_CATEGORIES = [
  {
    key: "overall_rating",
    label: "Overall Experience",
    icon: "⭐",
    description: "Rate your overall satisfaction with this purchase",
  },
  {
    key: "quality_rating",
    label: "Product Quality",
    icon: "🥬",
    description: "How would you rate the quality of the produce?",
  },
  {
    key: "freshness_rating",
    label: "Freshness",
    icon: "🌿",
    description: "How fresh was the produce when you received it?",
  },
  {
    key: "natural_practice_rating",
    label: "Natural Farming Trust",
    icon: "🌱",
    description: "Do you believe this was grown using natural methods?",
  },
  {
    key: "seller_communication_rating",
    label: "Seller Communication",
    icon: "💬",
    description: "How responsive and helpful was the seller?",
  },
  {
    key: "packaging_quality",
    label: "Packaging Quality",
    icon: "📦",
    description: "Rate the packaging and delivery condition",
  },
];

const REVIEW_QUESTIONS = [
  {
    key: "verified_natural",
    type: "boolean",
    question: "Did the produce seem naturally grown (chemical-free)?",
    icon: "🌱",
    helpText: "Consider taste, appearance, and overall quality",
  },
  {
    key: "would_recommend",
    type: "boolean",
    question: "Would you recommend this seller to others?",
    icon: "👍",
    helpText: "Based on your overall experience",
  },
];

export default function ProductReviewForm({
  show,
  onHide,
  order,
  product,
  seller,
  onReviewSubmitted,
}) {
  const [formData, setFormData] = useState({
    overall_rating: 0,
    quality_rating: 0,
    freshness_rating: 0,
    natural_practice_rating: 0,
    seller_communication_rating: 0,
    packaging_quality: 0,

    review_text: "",
    pros: "",
    cons: "",

    verified_natural: null,
    would_recommend: null,

    review_photos: [],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);

  const totalSteps = 3;

  const handleRatingChange = (category, rating) => {
    setFormData((prev) => ({
      ...prev,
      [category]: rating,
    }));
  };

  const handleBooleanChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTextChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoUpload = async (files) => {
    if (files.length === 0) return;

    setPhotoUploadProgress(10);

    try {
      // In a real implementation, upload to your file storage service
      // Simulating upload progress
      for (let i = 0; i <= 100; i += 20) {
        setPhotoUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const uploadedUrls = Array.from(files).map(
        (file, index) =>
          `https://example.com/reviews/${Date.now()}_${index}_${file.name}`
      );

      setFormData((prev) => ({
        ...prev,
        review_photos: [...prev.review_photos, ...uploadedUrls],
      }));

      toastService.success(`${files.length} photo(s) uploaded successfully`);
    } catch (error) {
      console.error("Error uploading photos:", error);
      toastService.error("Failed to upload photos");
    } finally {
      setPhotoUploadProgress(0);
    }
  };

  const getAverageRating = () => {
    const ratings = [
      formData.overall_rating,
      formData.quality_rating,
      formData.freshness_rating,
      formData.natural_practice_rating,
      formData.seller_communication_rating,
      formData.packaging_quality,
    ].filter((rating) => rating > 0);

    return ratings.length > 0
      ? (
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        ).toFixed(1)
      : 0;
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return (
          formData.overall_rating > 0 &&
          formData.quality_rating > 0 &&
          formData.freshness_rating > 0
        );
      case 2:
        return (
          formData.natural_practice_rating > 0 &&
          formData.verified_natural !== null &&
          formData.would_recommend !== null
        );
      case 3:
        return formData.review_text.trim().length > 10;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toastService.error("Please complete all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const submitReview = async () => {
    if (!validateStep(3)) {
      toastService.error("Please complete your review");
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        ...formData,
        order_id: order.id,
        product_id: product.id,
        seller_id: seller.id,
      };

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toastService.success(
        "Review submitted successfully! Thank you for your feedback."
      );
      onReviewSubmitted && onReviewSubmitted();
      onHide();
    } catch (error) {
      console.error("Error submitting review:", error);
      toastService.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (category, currentRating) => {
    return (
      <div className="star-rating d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="link"
            className={`p-1 ${
              currentRating >= star ? "text-warning" : "text-muted"
            }`}
            onClick={() => handleRatingChange(category.key, star)}
            style={{ fontSize: "1.5rem", textDecoration: "none" }}
          >
            ★
          </Button>
        ))}
        <span className="ms-2 text-muted">
          {currentRating > 0 ? `${currentRating}/5` : "Tap to rate"}
        </span>
      </div>
    );
  };

  const renderStep1 = () => (
    <div>
      <Alert variant="info">
        <Alert.Heading>📝 Rate Your Experience</Alert.Heading>
        <p className="mb-0">
          Please rate different aspects of your purchase to help other buyers
          make informed decisions.
        </p>
      </Alert>

      {RATING_CATEGORIES.slice(0, 3).map((category) => (
        <Card key={category.key} className="mb-3">
          <Card.Body>
            <div className="d-flex align-items-start">
              <div style={{ fontSize: "2rem" }} className="me-3">
                {category.icon}
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1">{category.label}</h6>
                <p className="text-muted small mb-2">{category.description}</p>
                {renderStarRating(category, formData[category.key])}
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <Alert variant="success">
        <Alert.Heading>🌱 Natural Farming Assessment</Alert.Heading>
        <p className="mb-0">
          Help build trust in our natural farming community by sharing your
          honest assessment.
        </p>
      </Alert>

      {RATING_CATEGORIES.slice(3).map((category) => (
        <Card key={category.key} className="mb-3">
          <Card.Body>
            <div className="d-flex align-items-start">
              <div style={{ fontSize: "2rem" }} className="me-3">
                {category.icon}
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1">{category.label}</h6>
                <p className="text-muted small mb-2">{category.description}</p>
                {renderStarRating(category, formData[category.key])}
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}

      <div className="mt-4">
        <h6>Trust Questions</h6>
        {REVIEW_QUESTIONS.map((question) => (
          <Card key={question.key} className="mb-3">
            <Card.Body>
              <div className="d-flex align-items-start">
                <div style={{ fontSize: "1.5rem" }} className="me-3">
                  {question.icon}
                </div>
                <div className="flex-grow-1">
                  <p className="mb-2">{question.question}</p>
                  <small className="text-muted d-block mb-3">
                    {question.helpText}
                  </small>

                  <ButtonGroup>
                    <Button
                      variant={
                        formData[question.key] === true
                          ? "success"
                          : "outline-success"
                      }
                      onClick={() => handleBooleanChange(question.key, true)}
                    >
                      ✓ Yes
                    </Button>
                    <Button
                      variant={
                        formData[question.key] === false
                          ? "danger"
                          : "outline-danger"
                      }
                      onClick={() => handleBooleanChange(question.key, false)}
                    >
                      ✗ No
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <Alert variant="primary">
        <Alert.Heading>💬 Written Review</Alert.Heading>
        <p className="mb-0">
          Share your detailed experience to help other community members.
        </p>
      </Alert>

      <Form.Group className="mb-4">
        <Form.Label>Overall Review *</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          placeholder="Share your experience with this seller and product. What did you like? How was the quality? Would you buy again?"
          value={formData.review_text}
          onChange={(e) => handleTextChange("review_text", e.target.value)}
        />
        <Form.Text className="text-muted">
          Minimum 10 characters ({formData.review_text.length}/10)
        </Form.Text>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>What did you like? (Pros)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="List positive aspects..."
              value={formData.pros}
              onChange={(e) => handleTextChange("pros", e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Any concerns? (Cons)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Any areas for improvement..."
              value={formData.cons}
              onChange={(e) => handleTextChange("cons", e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-4">
        <Form.Label>Add Photos (Optional)</Form.Label>
        <Form.Control
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handlePhotoUpload(e.target.files)}
          disabled={photoUploadProgress > 0}
        />
        {photoUploadProgress > 0 && (
          <ProgressBar
            now={photoUploadProgress}
            label={`${photoUploadProgress}%`}
            className="mt-2"
          />
        )}
        <Form.Text className="text-muted">
          Add photos of the product you received to help other buyers
        </Form.Text>

        {formData.review_photos.length > 0 && (
          <div className="mt-3">
            <h6>Uploaded Photos: {formData.review_photos.length}</h6>
            {formData.review_photos.map((url, index) => (
              <Badge key={index} bg="success" className="me-2">
                Photo {index + 1}
              </Badge>
            ))}
          </div>
        )}
      </Form.Group>

      <Card className="bg-light">
        <Card.Body>
          <h6>Review Summary</h6>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span>Average Rating:</span>
            <span className="fw-bold text-warning">
              ★ {getAverageRating()}/5
            </span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span>Natural Farming Trust:</span>
            <Badge bg={formData.verified_natural ? "success" : "warning"}>
              {formData.verified_natural ? "✓ Verified Natural" : "⚠ Uncertain"}
            </Badge>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span>Would Recommend:</span>
            <Badge bg={formData.would_recommend ? "success" : "danger"}>
              {formData.would_recommend ? "✓ Yes" : "✗ No"}
            </Badge>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>🌟 Review Your Purchase</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Product Info */}
        <Card className="mb-4 bg-light">
          <Card.Body className="p-3">
            <Row>
              <Col md={8}>
                <h6 className="mb-1">{product?.name}</h6>
                <div className="text-muted small">
                  <strong>Seller:</strong>{" "}
                  {seller?.business_name || seller?.name}
                </div>
                <div className="text-muted small">
                  <strong>Order ID:</strong> #{order?.id?.slice(0, 8)}
                </div>
              </Col>
              <Col md={4} className="text-end">
                <div className="text-muted small">
                  Step {currentStep} of {totalSteps}
                </div>
                <ProgressBar
                  now={(currentStep / totalSteps) * 100}
                  variant="success"
                  className="mt-1"
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </Modal.Body>

      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <Button
            variant="outline-secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <i className="ti ti-arrow-left me-2"></i>
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              variant="success"
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
            >
              Next
              <i className="ti ti-arrow-right ms-2"></i>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={submitReview}
              disabled={!validateStep(currentStep) || submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="ti ti-check me-2"></i>
                  Submit Review
                </>
              )}
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
