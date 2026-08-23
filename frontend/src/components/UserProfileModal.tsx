import React, { useContext } from 'react';
import Modal from './Modal';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  if (!user) return null;
  const initial = user.name.charAt(0).toUpperCase();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings">
      <div className="profile-details">
        <div className="profile-avatar-large">{initial}</div>
        <div>
          <h4 className="profile-name">{user.name}</h4>
          <div className="profile-email">{user.email}</div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="submit-btn"
        style={{ background: 'var(--danger)', boxShadow: 'none' }}
      >
        Log Out
      </button>
    </Modal>
  );
};
export default UserProfileModal;