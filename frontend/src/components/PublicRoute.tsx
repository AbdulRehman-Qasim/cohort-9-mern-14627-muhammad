import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PublicRoute: React.FC = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading-state">Loading authentication...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
