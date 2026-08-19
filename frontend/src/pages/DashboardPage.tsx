import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useContext(AuthContext);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, {user?.name || 'User'}!</p>
      <div className="auth-container success-container" style={{ margin: '2rem 0', textAlign: 'left' }}>
        <h3>Protected Content</h3>
        <p>This page is only accessible to authenticated users.</p>
        <p>Your Email: {user?.email}</p>
      </div>
    </div>
  );
};

export default DashboardPage;
