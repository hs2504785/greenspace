"use client";

import { Card, Badge, Button } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaGift, FaExchangeAlt, FaSeedling } from 'react-icons/fa';

export default function SeedCard({ seed, onUpdate }) {
  const router = useRouter();
  
  const handleCardClick = () => {
    router.push(`/seeds/${seed.id}`);
  };
  
  const primaryImage = seed.images && seed.images.length > 0 ? seed.images[0] : '/images/placeholder-seed.jpg';
  
  return (
    <Card 
      className="h-100 shadow-sm hover-shadow transition-all"
      style={{ cursor: 'pointer' }}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div 
        className="position-relative"
        style={{
          height: '200px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}
      >
        <Card.Img
          variant="top"
          src={primaryImage}
          alt={seed.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.src = '/images/placeholder-seed.jpg';
          }}
        />
        
        {/* Badges Overlay */}
        <div className="position-absolute top-0 start-0 m-2">
          {seed.is_free && (
            <Badge bg="success" className="me-1">
              <FaGift className="me-1" />
              FREE
            </Badge>
          )}
          {seed.is_heirloom && (
            <Badge bg="warning" text="dark">
              🌟 Heirloom
            </Badge>
          )}
        </div>
        
        {/* Category Badge */}
        {seed.category && (
          <div className="position-absolute bottom-0 end-0 m-2">
            <Badge bg="light" text="dark" className="px-2 py-1">
              {seed.category.icon} {seed.category.name}
            </Badge>
          </div>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column">
        {/* Title */}
        <Card.Title className="fw-bold text-dark mb-2" style={{ fontSize: '1.1rem' }}>
          {seed.name}
          {seed.variety && (
            <small className="text-muted d-block" style={{ fontSize: '0.85rem' }}>
              {seed.variety}
            </small>
          )}
        </Card.Title>
        
        {/* Description */}
        <Card.Text className="text-muted small mb-2 flex-grow-1" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {seed.description || 'No description available'}
        </Card.Text>
        
        {/* Seed Info */}
        <div className="mb-2">
          {seed.seed_type && (
            <Badge bg="secondary" className="me-1 mb-1" pill>
              {seed.seed_type}
            </Badge>
          )}
          {seed.difficulty_level && (
            <Badge
              bg={
                seed.difficulty_level === 'beginner' ? 'success' :
                seed.difficulty_level === 'intermediate' ? 'warning' : 'danger'
              }
              className="me-1 mb-1"
              pill
            >
              {seed.difficulty_level}
            </Badge>
          )}
        </div>
        
        {/* Availability */}
        <div className="mb-2">
          <small className="text-muted">
            <FaSeedling className="me-1 text-success" />
            {seed.quantity_available > 0
              ? `${seed.quantity_available} ${seed.quantity_unit} available`
              : 'Out of stock'
            }
          </small>
        </div>
        
        {/* Rating */}
        {seed.average_rating && (
          <div className="mb-2">
            <Badge bg="warning" text="dark">
              <FaStar className="me-1" />
              {seed.average_rating}
              {seed.review_count > 0 && (
                <small className="ms-1">({seed.review_count})</small>
              )}
            </Badge>
            {seed.average_germination_rate && (
              <Badge bg="info" className="ms-1">
                🌱 {seed.average_germination_rate}% germination
              </Badge>
            )}
          </div>
        )}
        
        {/* Owner Info */}
        {seed.user && (
          <div className="mb-2 pb-2 border-bottom">
            <small className="text-muted d-flex align-items-center">
              <div
                className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-2"
                style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}
              >
                {seed.user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-truncate">{seed.user.name}</span>
            </small>
            {seed.user.location && (
              <small className="text-muted d-block mt-1">
                <FaMapMarkerAlt className="me-1 text-danger" />
                {seed.user.location.substring(0, 30)}
                {seed.user.location.length > 30 && '...'}
              </small>
            )}
          </div>
        )}
        
        {/* Price/Exchange */}
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <div>
            {seed.is_free ? (
              <Badge bg="success" className="fs-6">FREE</Badge>
            ) : seed.price > 0 ? (
              <span className="text-success fw-bold">₹{seed.price}</span>
            ) : null}
          </div>
          {seed.is_for_exchange && (
            <Badge bg="info" pill>
              <FaExchangeAlt className="me-1" />
              Exchange
            </Badge>
          )}
        </div>
        
        {/* Action Button */}
        <Button
          variant={seed.is_free ? 'success' : 'primary'}
          size="sm"
          className="mt-2 w-100"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/seeds/${seed.id}`);
          }}
        >
          View Details
        </Button>
      </Card.Body>
    </Card>
  );
}

