import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import genesysService from '../services/genesysService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = genesysService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted location
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;