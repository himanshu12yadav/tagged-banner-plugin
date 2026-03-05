/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

/**
 * Checks if an error is a network-related error
 */
export function isNetworkError(error) {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  
  return (
    message.includes('fetch failed') ||
    message.includes('network error') ||
    message.includes('connection failed') ||
    message.includes('timeout') ||
    code === 'fetch_error' ||
    code === 'network_error' ||
    code === 'econnrefused' ||
    code === 'etimedout'
  );
}

/**
 * Checks if the user is online
 */
export function checkOnlineStatus() {
  return navigator.onLine;
}

/**
 * Handles GraphQL errors with user-friendly messages
 */
export function handleGraphQLError(error, context = '') {
  console.error(`GraphQL Error${context ? ` in ${context}` : ''}:`, error);
  
  if (isNetworkError(error)) {
    return {
      userMessage: "Network connection issue. Please check your internet connection and try again.",
      shouldRetry: true,
      isNetworkIssue: true
    };
  }
  
  if (error.message?.includes('unauthorized') || error.message?.includes('authentication')) {
    return {
      userMessage: "Authentication error. Please refresh the page and try again.",
      shouldRetry: false,
      isAuthIssue: true
    };
  }
  
  return {
    userMessage: "Something went wrong. Please try again.",
    shouldRetry: true,
    isNetworkIssue: false
  };
}

/**
 * Retry wrapper for async functions
 */
export async function retryAsync(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!isNetworkError(error) || i === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw lastError;
}
