/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

export default function ErrorPage() {
  const error = useRouteError();

  // Handle different types of errors
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for could not be found.</p>
          </div>
        );
      case 403:
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Access Denied</h1>
            <p>You don't have permission to access this feature.</p>
          </div>
        );
      case 500:
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Server Error</h1>
            <p>Something went wrong on our end. Please try again later.</p>
          </div>
        );
      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>{error.status} Error</h1>
            <p>{error.statusText || "An unexpected error occurred."}</p>
          </div>
        );
    }
  }

  // Default error handling
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Unexpected Error</h1>
      <p>{error?.message || "An unexpected error occurred."}</p>
    </div>
  );
}

export function ErrorBoundary() {
  return <ErrorPage />;
}
