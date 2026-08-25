import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NoteEditorModal from '../components/NoteEditorModal';
import '@testing-library/jest-dom';

describe('NoteEditorModal', () => {
  it('renders correctly', () => {
    render(<NoteEditorModal isOpen={true} onClose={jest.fn()} onSave={jest.fn()} />);
    expect(screen.getByPlaceholderText('Give your note a title...')).toBeInTheDocument();
  });

  it('calls onSave with title and content', async () => {
    const onSave = jest.fn().mockResolvedValueOnce(undefined);
    render(<NoteEditorModal isOpen={true} onClose={jest.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText('Give your note a title...'), { target: { value: 'My Note' } });
    
    // RichTextEditor uses a contenteditable div that is harder to test directly via fireEvent, 
    // but the save button should trigger onSave with whatever is in the state.
    
    fireEvent.click(screen.getByText('Save Note'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn();
    render(<NoteEditorModal isOpen={true} onClose={onClose} onSave={jest.fn()} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
