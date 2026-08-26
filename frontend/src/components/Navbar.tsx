import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Modal from './Modal';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLogoutModalOpen(false);
      navigate('/login');
    }
  };
  return (
    <>
      <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="navbar-brand-dot">
            <img src="/memoora-icon.svg" alt="Memoora Icon" style={{ width: '16px', height: '16px' }} />
          </span>
          Memoora
        </Link>
      </div>
      <div className="navbar-links">
        <NavLink to="/">Home</NavLink>
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <button onClick={() => setIsLogoutModalOpen(true)} className="navbar-logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>
      </nav>

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Confirm Logout">
        <p style={{ color: 'var(--text)', marginBottom: '1.5rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
          Are you sure you want to log out of your Memoora workspace?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setIsLogoutModalOpen(false)} style={{ padding: '0.5rem 1rem' }}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={confirmLogout} 
            style={{ 
              background: 'var(--danger)', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              boxShadow: 'none' 
            }}
          >
            Yes, Logout
          </button>
        </div>
      </Modal>
    </>
  );
};
export default Navbar;