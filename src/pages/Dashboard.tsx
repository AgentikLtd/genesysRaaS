import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Menu, Typography, Button, Space, Spin, Alert, theme, Badge, Tooltip } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  FileTextOutlined,
  HistoryOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  AimOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import genesysService from '../services/genesysService';
import { useAuth } from '../contexts/AuthContext';
import RulesEditor from './RulesEditor';
import VersionHistory from './VersionHistory';
import HelpWiki from '../components/HelpWiki';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface UserProfile {
  id: string;
  email: string;
  name: string;
  department?: string;
  title?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isTokenValid, tokenExpiry, token } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('rules');
  const [helpVisible, setHelpVisible] = useState(false);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Calculate OAuth token status for display (memoized to prevent excessive calls)
  const tokenStatus = useMemo(() => {
    // Check both AuthContext token and genesysService directly as fallback
    const authToken = token;
    const serviceToken = genesysService.getAccessToken();
    const currentToken = authToken || serviceToken;
    
    // Get expiry from AuthContext or genesysService
    let expiryTime = tokenExpiry;
    if (!expiryTime) {
      expiryTime = genesysService.getTokenExpiry();
    }
    
    if (!currentToken) {
      return { status: 'error', text: 'No Token', tooltip: 'OAuth token is not available' };
    }
    
    // Check if service thinks token is expired
    if (!genesysService.isAuthenticated()) {
      return { status: 'error', text: 'Expired', tooltip: 'OAuth token has expired' };
    }
    
    if (expiryTime) {
      const now = new Date();
      const timeLeft = expiryTime.getTime() - now.getTime();
      const minutesLeft = Math.floor(timeLeft / 60000);
      
      if (minutesLeft <= 0) {
        return { status: 'error', text: 'Expired', tooltip: 'OAuth token has expired' };
      } else if (minutesLeft <= 5) {
        return { 
          status: 'warning', 
          text: `${minutesLeft}m left`, 
          tooltip: `OAuth token expires in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}` 
        };
      } else if (minutesLeft <= 60) {
        return { 
          status: 'processing', 
          text: `${minutesLeft}m left`, 
          tooltip: `OAuth token expires in ${minutesLeft} minutes` 
        };
      } else {
        const hoursLeft = Math.floor(minutesLeft / 60);
        return { 
          status: 'success', 
          text: `${hoursLeft}h left`, 
          tooltip: `OAuth token expires in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}` 
        };
      }
    }
    
    return { status: 'success', text: 'Valid', tooltip: 'OAuth token is valid' };
  }, [token, tokenExpiry, forceUpdateCounter]); // Re-calculate when these values change

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Update token status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdateCounter(prev => prev + 1); // Force re-render to update token status
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await genesysService.getUserProfile();
      setUserProfile({
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.email,
        department: profile.department,
        title: profile.title
      });
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await genesysService.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to logout. Please try again.');
    }
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'rules':
        return <RulesEditor />;
      case 'history':
        return <VersionHistory />;
      default:
        return <RulesEditor />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        style={{ 
          background: '#fafafa',
          borderRight: '1px solid #e8e8e8'
        }}
      >
        <div style={{ 
          height: 32, 
          margin: 16, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {collapsed ? (
            <AimOutlined style={{ color: '#ff6b35', fontSize: '18px' }} />
          ) : (
            <Space>
              <AimOutlined style={{ color: '#ff6b35', fontSize: '18px' }} />
              <Title level={5} style={{ color: '#333', margin: 0 }}>
                RaaS Manager
              </Title>
            </Space>
          )}
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={({ key }) => setSelectedMenu(key)}
          style={{ background: 'transparent', border: 'none' }}
          items={[
            {
              key: 'rules',
              icon: <FileTextOutlined />,
              label: 'Rules Editor',
            },
            {
              key: 'history',
              icon: <HistoryOutlined />,
              label: 'Version History',
            },
          ]}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <Title level={3} style={{ margin: 0 }}>
              Genesys Routing Manager
            </Title>
          </Space>
          
          <Space>
            {/* OAuth Token Status Indicator */}
            <Tooltip title={tokenStatus.tooltip}>
              <div style={{ marginRight: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Badge status={tokenStatus.status as any} />
                <LockOutlined style={{ fontSize: '16px', color: '#666' }} />
              </div>
            </Tooltip>

            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => setHelpVisible(true)}
            >
              Help
            </Button>
            
            <Button 
              icon={<UserOutlined />}
              type="text"
            >
              {userProfile?.name}
            </Button>
            
            <Button 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              danger
            >
              Logout
            </Button>
          </Space>
        </Header>
        
        <Content style={{ margin: '24px' }}>
          {error && (
            <Alert
              message={error}
              type="error"
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16 }}
            />
          )}
          
          <div style={{ 
            padding: 24, 
            minHeight: 360, 
            background: colorBgContainer,
            borderRadius: 8
          }}>
            {renderContent()}
          </div>
        </Content>
      </Layout>
      
      <HelpWiki 
        visible={helpVisible} 
        onClose={() => setHelpVisible(false)} 
      />
    </Layout>
  );
};

export default Dashboard;