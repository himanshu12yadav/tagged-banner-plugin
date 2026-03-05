/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import React from "react";
import { Page, Card, BlockStack, Button } from "@shopify/polaris";
import {
  Error,
  ErrorBoundary,
  ErrorTypes,
  useErrorHandler,
  NetworkError,
  ValidationError,
  NotFoundError,
  ServerError,
} from "./Error.jsx";

// Example component that shows different error states
export const ErrorExamples = () => {
  const { error, handleError, clearError, retryHandler } = useErrorHandler();

  const triggerNetworkError = () => {
    handleError(new Error("Failed to fetch data"), ErrorTypes.NETWORK);
  };

  const triggerValidationError = () => {
    handleError(new Error("Invalid input"), ErrorTypes.VALIDATION);
  };

  const triggerServerError = () => {
    handleError(new Error("Internal server error"), ErrorTypes.SERVER);
  };

  if (error) {
    return (
      <Error
        type={error.type}
        title="Error occurred"
        message={error.error.message}
        onRetry={() => retryHandler()}
        showHome={true}
      />
    );
  }

  return (
    <Page title="Error Component Examples">
      <BlockStack gap="400">
        <Card sectioned>
          <BlockStack gap="200">
            <Button onClick={triggerNetworkError}>
              Trigger Network Error
            </Button>
            <Button onClick={triggerValidationError}>
              Trigger Validation Error
            </Button>
            <Button onClick={triggerServerError}>
              Trigger Server Error
            </Button>
          </BlockStack>
        </Card>

        <Card sectioned title="Network Error Example">
          <NetworkError
            message="Unable to connect to the API server"
            inline={true}
          />
        </Card>

        <Card sectioned title="Validation Error Example">
          <ValidationError
            message="Please enter a valid email address"
            inline={true}
          />
        </Card>

        <Card sectioned title="Not Found Error Example">
          <NotFoundError
            title="Product Not Found"
            message="The product you're looking for doesn't exist"
          />
        </Card>

        <Card sectioned title="Server Error Example">
          <ServerError
            message="Our servers are experiencing issues"
            showRetry={true}
          />
        </Card>

        <Card sectioned title="Error Boundary Example">
          <ErrorBoundary>
            <BuggyComponent />
          </ErrorBoundary>
        </Card>
      </BlockStack>
    </Page>
  );
};

// Component that will throw an error to test ErrorBoundary
const BuggyComponent = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error("I crashed!");
  }

  return (
    <div>
      <p>This component is working fine.</p>
      <Button onClick={() => setShouldThrow(true)}>
        Throw Error
      </Button>
    </div>
  );
};
