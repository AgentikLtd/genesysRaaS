import React from 'react';
import { Card, Tag, Space, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const EnvChecker: React.FC = () => {
  const envVars = {
    'Client ID': import.meta.env.VITE_GENESYS_CLIENT_ID,
    'Environment': import.meta.env.VITE_GENESYS_ENVIRONMENT,
    'Redirect URI': import.meta.env.VITE_REDIRECT_URI,
    'Rules Table ID': import.meta.env.VITE_RULES_TABLE_ID,
    'Logs Table ID': import.meta.env.VITE_LOGS_TABLE_ID,
  };

  const sdkCheck = typeof (window as any).purecloud !== 'undefined';
  const currentUrl = window.location.origin + '/auth/callback';

  return (
    <Card 
      title="Environment Configuration Check" 
      size="small"
      style={{ marginTop: 20, textAlign: 'left' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key}>
            <Text type="secondary">{key}: </Text>
            {value ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Set
              </Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />}>
                Not Set
              </Tag>
            )}
            {value && key === 'Redirect URI' && import.meta.env.DEV && (
              <div style={{ fontSize: '11px', marginTop: 4 }}>
                <Text type="secondary">Value: {value}</Text>
              </div>
            )}
          </div>
        ))}
        
        <div>
          <Text type="secondary">SDK Loaded: </Text>
          <Tag color={sdkCheck ? 'success' : 'error'}>
            {sdkCheck ? 'Yes' : 'No'}
          </Tag>
        </div>
        
        <div style={{ marginTop: 10 }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Expected callback URL: {currentUrl}
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default EnvChecker;