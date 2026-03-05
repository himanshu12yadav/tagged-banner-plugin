/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import React from "react";
import {
  Banner,
  Card,
  EmptyState,
  Button,
  Text,
  Icon,
  BlockStack,
} from "@shopify/polaris";
import {
  AlertTriangleIcon,
  RefreshIcon,
  HomeIcon,
} from "@shopify/polaris-icons";
import { useNavigate } from "@remix-run/react";

export const ErrorTypes = {
  NETWORK: "network",
  VALIDATION: "validation",
  GENERAL: "general",
  NOT_FOUND: "not_found",
  UNAUTHORIZED: "unauthorized",
  SERVER: "server",
};

export const Error = ({
  type = ErrorTypes.GENERAL,
  title,
  message,
  details,
  onRetry,
  onHome,
  showRetry = true,
  showHome = false,
  inline = false,
  children,
}) => {
  const navigate = useNavigate();

  const getErrorConfig = (errorType) => {
    switch (errorType) {
      case ErrorTypes.NETWORK:
        return {
          title: title || "Connection Error",
          message: message || "Unable to connect to server. Please check your internet connection.",
          tone: "critical",
          illustration: "/icons/network-error.svg",
        };
      case ErrorTypes.VALIDATION:
        return {
          title: title || "Validation Error",
          message: message || "Please check your input and try again.",
          tone: "warning",
          illustration: "/icons/validation-error.svg",
        };
      case ErrorTypes.NOT_FOUND:
        return {
          title: title || "Page Not Found",
          message: message || "The page you're looking for doesn't exist.",
          tone: "info",
          illustration: "/icons/not-found.svg",
        };
      case ErrorTypes.UNAUTHORIZED:
        return {
          title: title || "Access Denied",
          message: message || "You don't have permission to access this resource.",
          tone: "critical",
          illustration: "/icons/unauthorized.svg",
        };
      case ErrorTypes.SERVER:
        return {
          title: title || "Server Error",
          message: message || "Something went wrong on our end. Please try again later.",
          tone: "critical",
          illustration: "/icons/server-error.svg",
        };
      default:
        return {
          title: title || "Something went wrong",
          message: message || "An unexpected error occurred.",
          tone: "critical",
          illustration: "/icons/general-error.svg",
        };
    }
  };

  const config = getErrorConfig(type);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      navigate("/app");
    }
  };

  const actions = [];

  if (showRetry) {
    actions.push({
      content: "Try Again",
      onAction: handleRetry,
      icon: RefreshIcon,
    });
  }

  if (showHome) {
    actions.push({
      content: "Go Home",
      onAction: handleHome,
      icon: HomeIcon,
    });
  }

  // Inline error for smaller spaces
  if (inline) {
    return (
      <Banner
        title={config.title}
        tone={config.tone}
        onDismiss={onRetry}
      >
        <Text as="p">{config.message}</Text>
        {details && (
          <Text as="p" variant="bodyMd" tone="subdued">
            {details}
          </Text>
        )}
        {children}
      </Banner>
    );
  }

  // Full page error state
  return (
    <Card sectioned>
      <EmptyState
        heading={config.title}
        image={config.illustration}
        action={actions.length > 0 ? actions[0] : undefined}
        secondaryAction={actions.length > 1 ? actions[1] : undefined}
      >
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd">{config.message}</Text>
          {details && (
            <Text as="p" variant="bodyMd" tone="subdued">
              {details}
            </Text>
          )}
          {children}
        </BlockStack>
      </EmptyState>
    </Card>
  );
};

// Error Boundary Component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Error
          type={ErrorTypes.GENERAL}
          title="Application Error"
          message="Something went wrong in the application."
          details={
            this.props.showDetails && this.state.error
              ? this.state.error.toString()
              : undefined
          }
          onRetry={this.handleRetry}
          showHome={true}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for error handling
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error, type = ErrorTypes.GENERAL) => {
    console.error("Error handled:", error);
    setError({ error, type, timestamp: Date.now() });
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retryHandler = React.useCallback((retryFn) => {
    clearError();
    if (retryFn) {
      retryFn();
    }
  }, [clearError]);

  return {
    error,
    handleError,
    clearError,
    retryHandler,
  };
};

// Network Error Component
export const NetworkError = (props) => (
  <Error type={ErrorTypes.NETWORK} {...props} />
);

// Validation Error Component
export const ValidationError = (props) => (
  <Error type={ErrorTypes.VALIDATION} inline={true} {...props} />
);

// Not Found Error Component
export const NotFoundError = (props) => (
  <Error type={ErrorTypes.NOT_FOUND} showHome={true} {...props} />
);

// Server Error Component
export const ServerError = (props) => (
  <Error type={ErrorTypes.SERVER} {...props} />
);
