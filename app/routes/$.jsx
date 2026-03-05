/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

// This is a catch-all route for any unmatched paths
export default function CatchAllRoute() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

// Also handle errors in this route
export function ErrorBoundary() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>Something went wrong while trying to find this page.</p>
    </div>
  );
}
