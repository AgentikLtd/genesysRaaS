import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Space, 
  Badge, 
  Button,
  Tooltip,
  MenuProps
} from 'antd';
import {
  EditOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SafetyOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useRulesEditor } from '../contexts/RulesEditorContext';
import { HelpWiki } from './HelpWiki';

const { Header, Sider, Content } = Layout;

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, tokenExpiry } = useAuth();
  const { hasUnsavedChanges, isEditorActive } = useRulesEditor();
  const [helpVisible, setHelpVisible] = useState(false);
  const [tokenStatus, setTokenStatus] = useState({ status: 'success', text: 'Valid' });

  // Update token status indicator
  useEffect(() => {
    const updateTokenStatus = () => {
      if (!tokenExpiry) {
        setTokenStatus({ status: 'error', text: 'No token' });
        return;
      }

      const now = new Date();
      const timeLeft = tokenExpiry.getTime() - now.getTime();
      const minutesLeft = Math.floor(timeLeft / 60000);

      if (minutesLeft <= 0) {
        setTokenStatus({ status: 'error', text: 'Expired' });
      } else if (minutesLeft <= 5) {
        setTokenStatus({ status: 'warning', text: `Expires in ${minutesLeft}m` });
      } else {
        setTokenStatus({ status: 'success', text: `Valid for ${minutesLeft}m` });
      }
    };

    updateTokenStatus();
    const interval = setInterval(updateTokenStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [tokenExpiry]);

  const menuItems: MenuProps['items'] = [
    {
      key: '/rules',
      icon: <EditOutlined />,
      label: 'Rules Editor',
    },
    // {
    //   key: '/logs',
    //   icon: <FileTextOutlined />,
    //   label: 'Execution Logs',
    // },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: 'Version History',
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.email || 'User',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <>
      <Layout style={{ minHeight: '100vh', backgroundColor: 'var(--primary-bg)' }}>
        <Header style={{ 
          background: 'var(--secondary-bg)', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          height: '64px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            color: 'var(--text-primary)', 
            fontSize: '18px', 
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            Rules Engine Manager
          </div>
          
          <Space size="large">
            {/* Token Status Indicator */}
            <Tooltip title={`OAuth Token Status: ${tokenStatus.text}`}>
              <div style={{ marginRight: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Badge status={tokenStatus.status as any} />
                <SafetyOutlined style={{ color: 'var(--text-secondary)', fontSize: '16px' }} />
              </div>
            </Tooltip>

            {/* Rules Editor Status Indicator */}
            {(isEditorActive || hasUnsavedChanges) && (
              <Tooltip title={hasUnsavedChanges ? "Rules have unsaved changes" : "Rules editor is active"}>
                <Badge 
                  status={hasUnsavedChanges ? "error" : "processing"}
                  text={
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      <LockOutlined /> {hasUnsavedChanges ? "Unsaved" : "In Use"}
                    </span>
                  }
                />
              </Tooltip>
            )}

            {/* Help Button */}
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              onClick={() => setHelpVisible(true)}
              style={{ 
                color: 'var(--text-secondary)',
                border: 'none',
                background: 'transparent'
              }}
            >
              Help
            </Button>

            {/* User Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ 
                    backgroundColor: 'var(--accent-orange)',
                    border: 'none'
                  }}
                />
                <span style={{ fontSize: '14px' }}>{user?.name || 'User'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Layout style={{ backgroundColor: 'var(--primary-bg)' }}>
          <Sider 
            width={240} 
            style={{ 
              backgroundColor: 'var(--tertiary-bg)',
              borderRight: '1px solid var(--border-color)'
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{ 
                height: 'calc(100vh - 140px)', 
                borderRight: 0,
                backgroundColor: 'var(--tertiary-bg)',
                fontSize: '14px'
              }}
            />
            
            {/* Version info in footer of sider */}
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              width: '100%', 
              padding: '16px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--tertiary-bg)'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: '4px' }}>Rules Engine v2.0</div>
                <div>© 2024 Your Company</div>
              </div>
            </div>
          </Sider>
          
          <Layout style={{ 
            padding: '16px',
            backgroundColor: 'var(--primary-bg)'
          }}>
            <Content style={{ 
              background: 'var(--secondary-bg)', 
              padding: '24px', 
              margin: 0, 
              minHeight: 280,
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </Layout>

      {/* Help Wiki Modal */}
      <HelpWiki visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </>
  );
};