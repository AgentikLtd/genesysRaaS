import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Button, Space, Spin, Alert, theme } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  FileTextOutlined,
  HistoryOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  AimOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import genesysService from '../services/genesysService';
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('rules');
  const [helpVisible, setHelpVisible] = useState(false);
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    fetchUserProfile();
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
            <SettingOutlined style={{ color: '#ff6b35', fontSize: '20px' }} />
            <Title level={3} style={{ margin: 0 }}>
              Genesys Routing Manager
            </Title>
          </Space>
          
          <Space>
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