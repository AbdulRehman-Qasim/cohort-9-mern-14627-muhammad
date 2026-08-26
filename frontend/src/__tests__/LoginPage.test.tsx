import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { AuthContext } from '../context/AuthContext';
import '@testing-library/jest-dom';

const mockLogin = jest.fn();

const renderWithContext = (component: React.ReactNode): ReturnType<typeof render> => {
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        isAuthenticated: false,
        login: mockLogin,
        register: jest.fn(),
        logout: jest.fn(),
      }}
    >
      <BrowserRouter>{component}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form by default', () => {
    renderWithContext(<LoginPage />);
    expect(screen.getByText('Sign in to continue to your notes.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
  });

  it('submits login form successfully', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });
    renderWithContext(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password');
    });
  });

  it('displays error message on login failure', async () => {
    mockLogin.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' });
    renderWithContext(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
