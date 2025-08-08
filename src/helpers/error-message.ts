import { message } from 'antd';
import { AxiosError } from 'axios';

/**
 * Extract a user-friendly error message from various error types
 */
export const errorMessage = (e: unknown): string => {
  // Handle Axios errors
  if (isAxiosError(e)) {
    if (e.response?.data?.message) {
      return e.response.data.message;
    }
    if (e.response?.data?.error) {
      return e.response.data.error;
    }
    if (e.response?.status === 401) {
      return 'Authentication failed. Please login again.';
    }
    if (e.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (e.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (e.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
  }

  // Handle regular Error objects
  if (e instanceof Error) {
    return e.message;
  }

  // Handle objects with message property
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return String((e as any).message);
  }

  // Handle objects with toString method
  if (typeof e === 'object' && e !== null && 'toString' in e) {
    const str = (e as any).toString();
    if (str !== '[object Object]') {
      return str;
    }
  }

  // Fallback
  return 'An unexpected error occurred';
};

/**
 * Display an error message using Ant Design's message component
 */
export const displayError = (e: unknown): void => {
  const msg = errorMessage(e);
  message.error(msg);
  console.error('Error:', e); // Log full error for debugging
};

/**
 * Type guard to check if error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as any).isAxiosError === true
  );
}