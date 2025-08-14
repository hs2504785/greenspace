'use client';

import { useSearchParams } from 'next/navigation';
import { Container, Alert, Button } from 'react-bootstrap';
import Link from 'next/link';

const getErrorMessage = (error) => {
  switch (error) {
    case 'Configuration':
      return 'There is a problem with the server configuration. Please check if all required environment variables are set correctly.';
    case 'AccessDenied':
      return 'Access denied. You do not have permission to sign in.';
    case 'Verification':
      return 'The token has expired or has already been used.';
    case 'OAuthSignin':
      return 'Error occurred during OAuth sign-in attempt. Please check your OAuth configuration.';
    case 'OAuthCallback':
      return 'Error occurred during OAuth callback. Please check your OAuth redirect URIs.';
    case 'OAuthCreateAccount':
      return 'Could not create OAuth provider account. Please try again.';
    case 'EmailCreateAccount':
      return 'Could not create email provider account. Please try again.';
    case 'Callback':
      return 'Error occurred during the callback. Please check your callback URL configuration.';
    case 'OAuthAccountNotLinked':
      return 'This email is already associated with another account. Please sign in using the original provider.';
    case 'EmailSignin':
      return 'Check your email inbox for sign-in link.';
    case 'CredentialsSignin':
      return 'Sign in failed. Check the details you provided are correct.';
    case 'SessionRequired':
      return 'Please sign in to access this page.';
    default:
      return 'An unexpected error occurred. Please check your authentication configuration and try again.';
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
          Error code: {error || 'Unknown'}
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

      <div className="mt-4 text-center">
        <small className="text-muted">
          If this error persists, please contact support or check your authentication configuration.
        </small>
      </div>
    </Container>
  );
}
