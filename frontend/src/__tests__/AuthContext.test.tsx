import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import authService from '../services/auth.service';

jest.mock('../services/auth.service');

const TestComponent = () => {
  const { user, loading, isAuthenticated, login, logout } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes as unauthenticated when no user session exists', async () => {
    (authService.getCurrentUser as jest.Mock).mockResolvedValueOnce({ success: false });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
  });

  it('initializes as authenticated when user session exists', async () => {
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' };
    (authService.getCurrentUser as jest.Mock).mockResolvedValueOnce({ success: true, data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@test.com');
    });
  });

  it('handles login successfully', async () => {
    (authService.getCurrentUser as jest.Mock).mockResolvedValueOnce({ success: false });
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' };
    (authService.login as jest.Mock).mockResolvedValueOnce({ success: true, data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });

    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@test.com');
    });
  });
});
