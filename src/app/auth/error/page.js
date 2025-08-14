'use client';

import { useSearchParams } from 'next/navigation';
import { Container, Alert, Button } from 'react-bootstrap';
import Link from 'next/link';

const getErrorMessage = (error) => {
  switch (error) {
    case 'Configuration':
      return 'There is a problem with the server configuration. Check if all required environment variables are set.';
    case 'AccessDenied':
      return 'Access denied. You do not have permission to sign in.';
    case 'Verification':
      return 'The verification link is no longer valid. It may have expired or already been used.';
    case 'OAuthSignin':
      return 'Error occurred during OAuth sign-in attempt. Please try again.';
    case 'OAuthCallback':
      return 'Error occurred during OAuth callback. Please try again.';
    case 'OAuthCreateAccount':
      return 'Could not create OAuth provider account. Please try again.';
    case 'EmailCreateAccount':
      return 'Could not create email provider account. Please try again.';
    case 'Callback':
      return 'Error occurred during the callback. Please try again.';
    case 'OAuthAccountNotLinked':
      return 'Email already exists with different provider. Please sign in using the original provider.';
    case 'EmailSignin':
      return 'Check your email inbox for sign-in link.';
    case 'CredentialsSignin':
      return 'Sign in failed. Check the details you provided are correct.';
    case 'SessionRequired':
      return 'Please sign in to access this page.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = getErrorMessage(error);

  return (
    <Container className="py-5">
      <div className="text-center mb-4">
        <h2>Authentication Error</h2>
        <p className="text-muted">We encountered a problem while signing you in</p>
      </div>

      <Alert variant="danger" className="mb-4">
        <Alert.Heading>Error Details</Alert.Heading>
        <p>{errorMessage}</p>
        <hr />
        <p className="mb-0">
          Error code: {error}
        </p>
      </Alert>

      <div className="d-flex gap-3 justify-content-center">
        <Button 
          as={Link} 
          href="/login" 
          variant="primary"
        >
          Try Again
        </Button>
        <Button 
          as={Link} 
          href="/" 
          variant="outline-secondary"
        >
          Go Home
        </Button>
      </div>
    </Container>
  );
}
