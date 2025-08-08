import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Alert, Typography, Space, Spin } from 'antd';
import { LoginOutlined, LogoutOutlined, CheckCircleOutlined } from '@ant-design/icons';
import genesysService from '../services/genesysService';

const { Title, Text } = Typography;

interface LocationState {
  error?: string;
  from?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyAuthenticated, setIsAlreadyAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const state = location.state as LocationState;

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      setCheckingAuth(true);
      
      // Initialize the service first
      await genesysService.initialise();
      
      // Check if already authenticated
      if (genesysService.isAuthenticated()) {
        console.log('User already authenticated, checking token validity...');
        
        try {
          // Verify the token is still valid by making a test call
          const profile = await genesysService.getUserProfile();
          console.log('Token is valid, user:', profile.email);
          setIsAlreadyAuthenticated(true);
          
          // Auto redirect after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } catch (error) {
          console.log('Token invalid or expired, showing login page');
          setIsAlreadyAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
    } finally {
      setCheckingAuth(false);
    }

    // Show any error from the auth callback
    if (state?.error) {
      setError(state.error);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize first
      await genesysService.initialise();

      // Check if already authenticated
      if (genesysService.isAuthenticated()) {
        console.log('Already authenticated, verifying token...');
        
        try {
          // Verify token is valid
          await genesysService.getUserProfile();
          console.log('Token valid, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        } catch (error) {
          console.log('Token invalid, clearing and re-authenticating');
          // Clear invalid token
          await genesysService.logout();
        }
      }

      // Check if environment variables are set
      const clientId = import.meta.env.VITE_GENESYS_CLIENT_ID;
      const environment = import.meta.env.VITE_GENESYS_ENVIRONMENT;
      
      console.log('Environment check:', {
        clientId: clientId ? 'Set' : 'NOT SET',
        environment: environment || 'Using default',
        redirectUri: import.meta.env.VITE_REDIRECT_URI || 'Using default'
      });

      if (!clientId) {
        setError('Genesys Client ID is not configured. Please check your .env file.');
        setIsLoading(false);
        return;
      }

      // Store the intended destination in the state parameter
      const redirectPath = state?.from || '/dashboard';

      // Initiate the OAuth login flow
      // This will redirect the user to Genesys login page
      await genesysService.login(redirectPath);
      
      // Note: If we reach here, the redirect didn't happen
      console.error('OAuth redirect did not occur - you may already be logged in');
      
      // Try one more time to check if authenticated
      if (genesysService.isAuthenticated()) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Login redirect failed. Try clearing your browser cache or using incognito mode.');
      }
    } catch (err: any) {
      console.error('Login initiation failed:', err);
      setError(err.message || 'Failed to initiate login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceLogout = async () => {
    try {
      setIsLoading(true);
      await genesysService.logout();
      setIsAlreadyAuthenticated(false);
      setError(null);
      // Clear any cached auth data
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Failed to logout. Please clear your browser cache.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5'
      }}>
        <Spin size="large" tip="Checking authentication..." />
      </div>
    );
  }

  if (isAlreadyAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5'
      }}>
        <Card
          style={{ width: 400, textAlign: 'center' }}
          styles={{ body: { padding: '40px' } }}
        >
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 20 }} />
          
          <Title level={3} style={{ marginBottom: '20px' }}>
            Already Authenticated
          </Title>
          
          <Text type="secondary" style={{ display: 'block', marginBottom: '30px' }}>
            You're already logged in to Genesys Cloud. Redirecting to dashboard...
          </Text>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%' }}
            >
              Go to Dashboard Now
            </Button>

            <Button
              size="large"
              icon={<LogoutOutlined />}
              onClick={handleForceLogout}
              loading={isLoading}
              style={{ width: '100%' }}
            >
              Logout and Sign In Again
            </Button>
          </Space>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginTop: '20px' }}
            />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <Card
        style={{ width: 400, textAlign: 'center' }}
        styles={{ body: { padding: '40px' } }}
      >
        <Title level={2} style={{ marginBottom: '30px' }}>
          Welcome
        </Title>
        
        <Text type="secondary" style={{ display: 'block', marginBottom: '30px' }}>
          Please sign in with your Genesys account to continue
        </Text>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: '20px' }}
          />
        )}

        <Button
          type="primary"
          size="large"
          icon={<LoginOutlined />}
          loading={isLoading}
          onClick={handleLogin}
          style={{ width: '100%' }}
        >
          Sign in with Genesys
        </Button>

        <div style={{ marginTop: '20px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            You will be redirected to the Genesys login page
          </Text>
        </div>

        {/* Debug info - remove in production */}
        {import.meta.env.DEV && (
          <div style={{ marginTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            <Text type="secondary">Debug Info:</Text>
            <div>Client ID: {import.meta.env.VITE_GENESYS_CLIENT_ID ? '✓' : '✗'}</div>
            <div>Environment: {import.meta.env.VITE_GENESYS_ENVIRONMENT || 'default'}</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;