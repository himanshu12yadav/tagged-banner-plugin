/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { authenticate } from "../shopify.server";

import createApp from "@shopify/app-bridge";
import { URLSearchParams } from "node:url";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const urlParams = new URLSearchParams(window.location.search);

  const app = createApp({
    apiKey: process.env.SHOPIFY_API_KEY,
    host: urlParams.get("host"),
  });

  await authenticate.admin(request);

  return json({
    apiKey: process.env.SHOPIFY_API_KEY,
  });
};
export default function App() {
  const { apiKey } = useLoaderData();
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <DndProvider backend={HTML5Backend}>
        <NavMenu>
          <Link to="/app" rel="home">
            Home
          </Link>
          <Link to="/app/instruction">How to add Widget</Link>
        </NavMenu>
        <Outlet />
      </DndProvider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  const error = useRouteError();
  if (error.status === 401) {
    return (
      <div>
        <h1>Authentication Error</h1>
        <p>Please verify your credentials and try again.</p>
      </div>
    );
  }

  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
