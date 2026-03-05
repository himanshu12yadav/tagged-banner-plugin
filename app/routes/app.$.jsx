/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

// This handles any unmatched routes under /app
export default function AppCatchAllRoute() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - App Page Not Found</h1>
      <p>This app page doesn't exist.</p>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - App Page Not Found</h1>
      <p>We couldn't find what you're looking for in the app.</p>
    </div>
  );
}
