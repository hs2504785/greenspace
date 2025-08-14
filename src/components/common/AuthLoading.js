'use client';

import { Container } from 'react-bootstrap';

export default function AuthLoading() {
  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading authentication...</p>
      </div>
    </Container>
  );
}
