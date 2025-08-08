import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Login from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

const App: React.FC = () => {
  const lightTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#ff6b35',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#f5f5f5',
      colorText: '#333333',
      colorTextSecondary: '#666666',
      colorBorder: '#d9d9d9',
      colorBorderSecondary: '#e8e8e8',
      borderRadius: 8,
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    },
    components: {
      Layout: {
        headerBg: '#ffffff',
        bodyBg: '#f5f5f5',
        siderBg: '#fafafa',
      },
      Menu: {
        itemBg: '#fafafa',
        itemSelectedBg: '#ff6b35',
        itemHoverBg: '#f0f0f0',
        itemColor: '#666666',
        itemHoverColor: '#333333',
        itemSelectedColor: '#ffffff',
      },
      Button: {
        primaryColor: '#ffffff',
        colorPrimaryHover: '#e55a2b',
        colorPrimaryActive: '#d44d1f',
      },
      Card: {
        headerBg: '#fafafa',
      },
    },
  };

  return (
    <ConfigProvider theme={lightTheme}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Add more protected routes here */}
          {/* <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          /> */}
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 page - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;