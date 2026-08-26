import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const renderWithContext = (component: React.ReactNode): ReturnType<typeof render> => {
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
    expect(screen.getByText('Loading your workspace...')).toBeInTheDocument();
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
      expect(screen.getByText("Your ideas deserve a place to live. Create your first note and start organizing your thoughts.")).toBeInTheDocument();
    });
  });

  describe('CSV Export', () => {
    let mockCreateElement: jest.SpyInstance;
    let mockAppendChild: jest.SpyInstance;
    let mockRemoveChild: jest.SpyInstance;
    let mockClick: jest.Mock;

    beforeEach(() => {
      window.URL.createObjectURL = jest.fn();
      window.URL.revokeObjectURL = jest.fn();

      mockClick = jest.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };

      const originalCreateElement = document.createElement.bind(document);
      mockCreateElement = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') return mockAnchor as any;
        if (tagName === 'textarea') {
          return {
            get value() { return this.innerHTML; },
            set innerHTML(val: string) { (this as any)._html = val; },
            get innerHTML() { return (this as any)._html || ''; }
          } as any;
        }
        return originalCreateElement(tagName as any);
      });

      const originalAppendChild = document.body.appendChild.bind(document.body);
      const originalRemoveChild = document.body.removeChild.bind(document.body);

      mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if ((node as any) === mockAnchor) return node;
        return originalAppendChild(node);
      });
      mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => {
        if ((node as any) === mockAnchor) return node;
        return originalRemoveChild(node);
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('exports notes as CSV with correct escaping and formatting', async () => {
      const mockNotes = [
        {
          id: '1',
          title: 'Normal Note',
          content: '<p>Simple content</p>',
          createdAt: '2026-08-26T10:00:00Z',
          updatedAt: '2026-08-26T10:00:00Z',
        },
        {
          id: '2',
          title: 'Complex, "Title"',
          content: 'Line 1<br>Line 2 with "quotes" and, commas',
          createdAt: '2026-08-27T10:00:00Z',
          updatedAt: '2026-08-27T10:00:00Z',
        }
      ];
      (notesService.getNotes as jest.Mock).mockResolvedValueOnce({ success: true, data: mockNotes });

      renderWithContext(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Normal Note')).toBeInTheDocument();
      });

      // Find and click the export button
      const exportBtn = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportBtn);

      // Verify Blob creation
      const blobCall = (window.URL.createObjectURL as jest.Mock).mock.calls[0][0];
      expect(blobCall).toBeInstanceOf(Blob);
      expect(blobCall.type).toBe('text/csv;charset=utf-8;');

      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blobCall);
      });
      
      // Verify Headers
      expect(text).toContain('Title,Content,Created At,Updated At');
      
      // Verify Note 1
      expect(text).toContain('"Normal Note","Simple content","2026-08-26","2026-08-26"');
      
      // Verify Note 2 (Quotes doubled, Commas inside quotes, Newlines)
      expect(text).toContain('"Complex, ""Title""","Line 1\nLine 2 with ""quotes"" and, commas","2026-08-27","2026-08-27"');
      
      // Verify Download Attributes
      const anchor = mockCreateElement.mock.results.find(r => r.value && r.value.click === mockClick)?.value;
      expect(anchor?.download).toMatch(/^Memoora-notes-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(mockClick).toHaveBeenCalled();
    });

    it('handles empty notes export cleanly', async () => {
      (notesService.getNotes as jest.Mock).mockResolvedValueOnce({ success: true, data: [] });
      renderWithContext(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
      });

      const exportBtn = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportBtn);

      expect(window.URL.createObjectURL).not.toHaveBeenCalled();
    });
  });
});
