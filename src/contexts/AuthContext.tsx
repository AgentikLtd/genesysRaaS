import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { genesysService } from '../services/genesysService';
import { createAuthenticatedAxios } from '../utils/apiInterceptor';
import { message } from 'antd';
import { AxiosInstance } from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  tokenExpiry: Date | null;
  apiClient: AxiosInstance | null;
  login: () => void;
  logout: () => void;
  isTokenValid: () => boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token refresh interval - 30 minutes
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [apiClient, setApiClient] = useState<AxiosInstance | null>(null);
  const navigate = useNavigate();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  // Create token manager for the interceptor
  const tokenManager = {
    getToken: () => token,
    refreshToken: async () => {
      // If already refreshing, wait for the existing refresh
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      // Create a new refresh promise
      refreshPromiseRef.current = performTokenRefresh();
      
      try {
        await refreshPromiseRef.current;
      } finally {
        refreshPromiseRef.current = null;
      }
    },
    logout: () => logout()
  };

  // Initialize API client when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const client = createAuthenticatedAxios(tokenManager, {
        baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
        timeout: 30000,
        onUnauthorised: () => {
          message.error('Your session has expired. Please log in again.');
          logout();
        }
      });
      setApiClient(client);
    } else {
      setApiClient(null);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
    
    // Set up automatic token refresh
    const interval = setInterval(() => {
      if (isAuthenticated) {
        checkAndRefreshToken();
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // Listen for page reload/refresh
    const handleBeforeUnload = () => {
      // Store auth state in session storage
      if (isAuthenticated && token) {
        sessionStorage.setItem('auth_backup', JSON.stringify({
          token,
          user,
          expiry: tokenExpiry?.toISOString()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, token, user, tokenExpiry]);

  /**
   * Check if user is authenticated on app load
   */
  const checkAuth = async () => {
    try {
      // First, check session storage for auth backup
      const authBackup = sessionStorage.getItem('auth_backup');
      if (authBackup) {
        const { token: savedToken, user: savedUser, expiry } = JSON.parse(authBackup);
        sessionStorage.removeItem('auth_backup'); // Clear immediately
        
        if (savedToken && expiry) {
          const expiryDate = new Date(expiry);
          if (expiryDate > new Date()) {
            // Token is still valid
            setToken(savedToken);
            setUser(savedUser);
            setTokenExpiry(expiryDate);
            setIsAuthenticated(true);
            genesysService.setAccessToken(savedToken);
            
            // Schedule refresh
            scheduleTokenRefresh(expiryDate);
            return;
          }
        }
      }

      // Check if we have a valid token in Genesys service
      const isAuth = await genesysService.isAuthenticated();
      if (isAuth) {
        // Get user info
        const currentUser = await genesysService.getCurrentUser();
        const currentToken = genesysService.getAccessToken();
        const expiry = calculateTokenExpiry();
        
        setUser(currentUser);
        setToken(currentToken);
        setTokenExpiry(expiry);
        setIsAuthenticated(true);
        
        // Schedule refresh
        scheduleTokenRefresh(expiry);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't set authenticated to false here - might be temporary network issue
    }
  };

  /**
   * Calculate token expiry time (8 hours for implicit grant)
   */
  const calculateTokenExpiry = (): Date => {
    const expiry = new Date();
    // Implicit grant tokens are valid for 8 hours
    expiry.setHours(expiry.getHours() + 8);
    return expiry;
  };

  /**
   * Schedule automatic token refresh
   */
  const scheduleTokenRefresh = (expiryTime: Date) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const now = new Date();
    const timeUntilRefresh = expiryTime.getTime() - now.getTime() - TOKEN_REFRESH_BUFFER;

    if (timeUntilRefresh > 0) {
      console.log(`Scheduling token refresh in ${Math.round(timeUntilRefresh / 1000)} seconds`);
      
      refreshTimerRef.current = setTimeout(() => {
        refreshToken();
      }, timeUntilRefresh);
    } else {
      // Token needs refresh immediately
      refreshToken();
    }
  };

  /**
   * Check if token needs refresh and refresh if necessary
   */
  const checkAndRefreshToken = async () => {
    if (!isAuthenticated || !tokenExpiry) return;

    const now = new Date();
    const timeUntilExpiry = tokenExpiry.getTime() - now.getTime();

    // Refresh if less than 5 minutes until expiry
    if (timeUntilExpiry < TOKEN_REFRESH_BUFFER) {
      await refreshToken();
    }
  };

  /**
   * Perform the actual token refresh
   */
  const performTokenRefresh = async (): Promise<void> => {
    try {
      console.log('Refreshing OAuth token...');
      
      // For implicit grant, we need to re-authenticate
      // Store current location to return after refresh
      const currentPath = window.location.pathname;
      sessionStorage.setItem('post_refresh_redirect', currentPath);
      
      // Trigger re-authentication
      login();
      
      // Note: This will redirect to Genesys, so the promise won't resolve normally
      // We include a timeout as a fallback
      return new Promise((resolve) => {
        setTimeout(resolve, 30000); // 30 second timeout
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  /**
   * Public refresh token method
   */
  const refreshToken = async () => {
    return tokenManager.refreshToken();
  };

  /**
   * Check if the current token is valid
   */
  const isTokenValid = (): boolean => {
    if (!token || !tokenExpiry) return false;
    
    const now = new Date();
    return tokenExpiry.getTime() > now.getTime();
  };

  /**
   * Initiate login process
   */
  const login = () => {
    genesysService.login();
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await genesysService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setTokenExpiry(null);
      setApiClient(null);
      
      // Clear any refresh timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      // Clear any stored auth
      sessionStorage.removeItem('auth_backup');
      sessionStorage.removeItem('post_refresh_redirect');
      
      // Navigate to login
      navigate('/login');
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    tokenExpiry,
    apiClient,
    login,
    logout,
    isTokenValid,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};