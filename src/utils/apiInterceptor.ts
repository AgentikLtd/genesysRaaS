import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

/**
 * Token manager interface for getting current auth token
 */
interface TokenManager {
  getToken: () => string | null;
  refreshToken: () => Promise<void>;
  logout: () => void;
}

/**
 * Configuration options for the authenticated axios instance
 */
interface AuthenticatedAxiosConfig {
  baseURL?: string;
  timeout?: number;
  onUnauthorised?: () => void;
}

/**
 * Enhanced error type for better error handling
 */
interface ApiError extends AxiosError {
  isTokenExpired?: boolean;
  isNetworkError?: boolean;
}

/**
 * Queue for pending requests during token refresh
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  
  failedQueue = [];
};

/**
 * Create an axios instance with authentication interceptors
 * Automatically adds auth token to requests and handles token expiry
 */
export function createAuthenticatedAxios(
  tokenManager: TokenManager,
  config: AuthenticatedAxiosConfig = {}
): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 30000, // 30 second timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = tokenManager.getToken();
      
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token expiry and errors
  instance.interceptors.response.use(
    (response) => {
      // Successfully got response - return it
      return response;
    },
    async (error: ApiError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      // Handle network errors
      if (!error.response) {
        error.isNetworkError = true;
        message.error('Network error. Please check your connection.');
        return Promise.reject(error);
      }

      // Handle 401 Unauthorised errors
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        isRefreshing = true;

        try {
          // Attempt to refresh the token
          await tokenManager.refreshToken();
          const newToken = tokenManager.getToken();
          
          if (newToken) {
            // Token refreshed successfully
            processQueue(null, newToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          // Token refresh failed
          processQueue(refreshError, null);
          error.isTokenExpired = true;
          
          // Call the onUnauthorised callback if provided
          if (config.onUnauthorised) {
            config.onUnauthorised();
          } else {
            // Default behaviour - logout and show message
            message.error('Your session has expired. Please log in again.');
            tokenManager.logout();
          }
          
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle other error responses
      handleApiError(error);
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Handle various API error responses
 */
function handleApiError(error: ApiError) {
  if (!error.response) {
    return;
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      message.error(data?.message || 'Bad request. Please check your input.');
      break;
    case 403:
      message.error('You do not have permission to perform this action.');
      break;
    case 404:
      message.error('The requested resource was not found.');
      break;
    case 409:
      message.error(data?.message || 'Resource conflict. Please try again.');
      break;
    case 422:
      message.error(data?.message || 'Validation error. Please check your input.');
      break;
    case 429:
      message.error('Too many requests. Please try again later.');
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      message.error('Server error. Please try again later.');
      break;
    default:
      if (status >= 400 && status < 500) {
        message.error(data?.message || `Client error: ${status}`);
      } else if (status >= 500) {
        message.error(data?.message || `Server error: ${status}`);
      }
  }
}

/**
 * Create a simple axios instance without authentication
 * Useful for public endpoints or external APIs
 */
export function createPublicAxios(config: Omit<AuthenticatedAxiosConfig, 'onUnauthorised'> = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Simple error handling for public endpoints
  instance.interceptors.response.use(
    (response) => response,
    (error: ApiError) => {
      if (!error.response) {
        error.isNetworkError = true;
        message.error('Network error. Please check your connection.');
      } else {
        handleApiError(error);
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Utility function to extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Type guard to check if error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

/**
 * Type guard to check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

/**
 * Type guard to check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401;
}