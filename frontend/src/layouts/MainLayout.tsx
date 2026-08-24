import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
const MainLayout: React.FC = () => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};
export default MainLayout;