import { createAuthenticatedAxios } from '../utils/apiInterceptor';
import { genesysService } from './genesysService';

/**
 * Token manager implementation that integrates with GenesysService
 */
const tokenManager = {
  getToken: () => {
    return genesysService.getAccessToken();
  },
  
  refreshToken: async () => {
    // For implicit grant, we need to re-authenticate
    const currentPath = window.location.pathname;
    sessionStorage.setItem('post_refresh_redirect', currentPath);
    
    // Trigger re-authentication via Genesys login
    genesysService.login();
    
    // Note: This will redirect to Genesys, so the Promise won't resolve
    // The page will reload after successful auth
    return new Promise<void>((resolve) => {
      // This promise typically won't resolve due to redirect
      setTimeout(resolve, 30000); // Timeout fallback
    });
  },
  
  logout: () => {
    genesysService.logout();
    window.location.href = '/login';
  }
};

/**
 * Authenticated API client for backend APIs
 * Use this for any API calls that require authentication
 */
export const apiClient = createAuthenticatedAxios(tokenManager, {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  onUnauthorised: () => {
    console.log('Session expired - redirecting to login');
    // Additional handling if needed
  }
});