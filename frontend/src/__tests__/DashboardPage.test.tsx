import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import { AuthContext } from '../context/AuthContext';
import notesService from '../services/notes.service';
import '@testing-library/jest-dom';

jest.mock('../services/notes.service');
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn()
  }))
}));

const renderWithContext = (component: React.ReactNode) => {
  return render(
    <AuthContext.Provider
      value={{
        user: { id: '1', name: 'Test User', email: 'test@test.com' },
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      }}
    >
      <BrowserRouter>{component}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (notesService.getNotes as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithContext(<DashboardPage />);
    expect(screen.getByText('Loading your notes...')).toBeInTheDocument();
  });

  it('renders notes after fetching', async () => {
    const mockNotes = [
      { id: '1', title: 'Test Note', content: '<p>Content</p>', createdAt: new Date().toISOString() }
    ];
    (notesService.getNotes as jest.Mock).mockResolvedValueOnce({ success: true, data: mockNotes });

    renderWithContext(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });
  });

  it('renders empty state if no notes', async () => {
    (notesService.getNotes as jest.Mock).mockResolvedValueOnce({ success: true, data: [] });

    renderWithContext(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't created any notes. Click the button below to capture your first idea.")).toBeInTheDocument();
    });
  });
});
