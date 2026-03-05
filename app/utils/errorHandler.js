/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import { ErrorTypes } from '../component/Error';

export class ErrorHandler {
  static logError(error, context = {}) {

    // In production, you might want to send this to an error reporting service
    // like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: context });
    }
  }

  static handleGraphQLError(error) {


    if (error.message?.includes('fetch failed')) {
      return {
        type: ErrorTypes.NETWORK,
        message: 'Unable to connect to Shopify. Please check your connection.',
        originalError: error,
      };
    }

    if (error.message?.includes('Unauthorized')) {
      return {
        type: ErrorTypes.UNAUTHORIZED,
        message: 'Authentication failed. Please reconnect your app.',
        originalError: error,
      };
    }

    if (error.message?.includes('Rate limit')) {
      return {
        type: ErrorTypes.SERVER,
        message: 'Too many requests. Please try again later.',
        originalError: error,
      };
    }

    return {
      type: ErrorTypes.SERVER,
      message: 'A server error occurred. Please try again.',
      originalError: error,
    };
  }

  static handleValidationError(fieldErrors) {
    const messages = Object.entries(fieldErrors).map(
      ([field, error]) => `${field}: ${error}`
    );

    return {
      type: ErrorTypes.VALIDATION,
      message: 'Please fix the following errors:',
      details: messages.join(', '),
    };
  }

  static handleNetworkError(error) {
    this.logError(error, { type: 'network' });

    return {
      type: ErrorTypes.NETWORK,
      message:
        'Network connection failed. Please check your internet connection.',
      originalError: error,
    };
  }

  static handleUnexpectedError(error) {
    this.logError(error, { type: 'unexpected' });

    return {
      type: ErrorTypes.GENERAL,
      message: 'An unexpected error occurred. Please try again.',
      originalError: error,
    };
  }

  static isRetryableError(errorType) {
    return [ErrorTypes.NETWORK, ErrorTypes.SERVER, ErrorTypes.GENERAL].includes(
      errorType
    );
  }

  static getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unknown error occurred';
  }

  static shouldShowDetails(error) {
    // Only show error details in development
    return process.env.NODE_ENV === 'development';
  }
}

// Hook for handling errors in React components
import { useCallback, useState } from 'react';

export const useErrorHandling = () => {
  const [errors, setErrors] = useState([]);

  const addError = useCallback((error, context = {}) => {
    const errorId = Date.now().toString();
    const processedError = {
      id: errorId,
      timestamp: new Date().toISOString(),
      ...ErrorHandler.handleUnexpectedError(error),
      context,
    };

    setErrors((prev) => [...prev, processedError]);
    ErrorHandler.logError(error, context);

    return errorId;
  }, []);

  const removeError = useCallback((errorId) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearAllErrors,
  };
};

// Utility functions for common error scenarios
export const errorUtils = {
  // Handle GraphQL query errors
  withGraphQLErrorHandling: async (queryFn, fallback = null) => {
    try {
      return await queryFn();
    } catch (error) {
      const processedError = ErrorHandler.handleGraphQLError(error);
      return fallback;
    }
  },

  // Handle network requests with retry logic
  withRetry: async (fn, maxRetries = 3, delay = 1000) => {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError;
  },

  // Validate form data
  validateForm: (data, rules) => {
    const errors = {};

    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];

      if (rule.required && (!value || value.trim() === '')) {
        errors[field] = 'This field is required';
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errors[field] = `Must be at least ${rule.minLength} characters`;
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[field] = rule.message || 'Invalid format';
      }
    });

    return Object.keys(errors).length > 0 ? errors : null;
  },
};
