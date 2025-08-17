"use client";

import { useSession } from "next-auth/react";
import { Container, Card } from "react-bootstrap";

export default function TestSessionPage() {
  const { data: session, status } = useSession();

  return (
    <Container className="pb-4">
      <Card>
        <Card.Header>Session Data</Card.Header>
        <Card.Body>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </Card.Body>
      </Card>
    </Container>
  );
}
