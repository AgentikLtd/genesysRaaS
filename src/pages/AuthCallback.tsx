import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Result, Card, Typography } from 'antd';
import { genesysService } from '../services/genesysService';

const { Text, Paragraph } = Typography;

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Debug: Log the full URL
      console.log('Full callback URL:', window.location.href);
      console.log('URL hash:', window.location.hash);
      
      // Store debug info
      setDebugInfo({
        url: window.location.href,
        hash: window.location.hash,
        origin: window.location.origin,
        pathname: window.location.pathname
      });

      // Check if this is an error response
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Debug: Log all parameters
      console.log('URL Parameters:');
      urlParams.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });

      const errorParam = urlParams.get('error');
      
      if (errorParam) {
        const errorDescription = urlParams.get('error_description') || 'Authentication failed';
        setError(`${errorParam}: ${errorDescription}`);
        
        // Redirect to login after showing error
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      
      // Check if we have an access token
      const accessToken = urlParams.get('access_token');
      if (!accessToken) {
        console.error('No access token found in URL');
        setError('No access token received from Genesys Cloud');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      
      console.log('Access token found, length:', accessToken.length);
      
      // Handle successful authentication
      const returnPath = await genesysService.handleAuthCallback();
      
      console.log('Auth callback successful, redirecting to:', returnPath);
      
      // Use navigate instead of window.location.href to avoid encoding issues
      navigate(returnPath, { replace: true });
    } catch (error: any) {
      console.error('Auth callback failed:', error);
      console.error('Error stack:', error.stack);
      
      // Enhanced error info
      const errorMessage = error.message || 'Authentication callback failed';
      const enhancedError = `${errorMessage} (Check browser console for details)`;
      
      setError(enhancedError);
      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        stack: error.stack
      }));
      
      // Redirect to login after showing error
      setTimeout(() => navigate('/login'), 5000);
    }
  };

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 600 }}>
          <Result
            status="error"
            title="Authentication Failed"
            subTitle={error}
          />
          
          {/* Debug Information - Remove in production */}
          <Card type="inner" title="Debug Information" style={{ marginTop: 16 }}>
            <Paragraph>
              <Text strong>URL: </Text>
              <Text code style={{ fontSize: '12px' }}>{debugInfo.url}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Hash: </Text>
              <Text code style={{ fontSize: '12px' }}>{debugInfo.hash || 'No hash'}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Origin: </Text>
              <Text code>{debugInfo.origin}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Pathname: </Text>
              <Text code>{debugInfo.pathname}</Text>
            </Paragraph>
            {debugInfo.error && (
              <Paragraph>
                <Text strong>Error: </Text>
                <Text type="danger">{debugInfo.error}</Text>
              </Paragraph>
            )}
          </Card>
          
          <Paragraph style={{ marginTop: 16, textAlign: 'center' }}>
            <Text type="secondary">Redirecting to login in 5 seconds...</Text>
          </Paragraph>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <Spin size="large" tip="Completing authentication..." />
    </div>
  );
};

export default AuthCallback;