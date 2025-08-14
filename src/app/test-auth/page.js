'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { Container, Button } from "react-bootstrap";

export default function TestAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (session) {
    return (
      <Container className="py-5">
        <h1>Signed in as {session.user?.email}</h1>
        <Button variant="danger" onClick={() => signOut()}>Sign out</Button>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1>Not signed in</h1>
      <Button variant="success" onClick={() => signIn()}>Sign in</Button>
    </Container>
  );
}
