import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import RichTextEditor from './RichTextEditor';
interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  initialTitle?: string;
  initialContent?: string;
  isSubmitting?: boolean;
  error?: string;
}
const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen, onClose, onSave, initialTitle = '', initialContent = '', isSubmitting = false, error = ''
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent(initialContent);
    }
  }, [isOpen, initialTitle, initialContent]);
  const handleSave = () => {
    onSave(title, content);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialTitle ? "Edit Note" : "New Note"}>
      {error && <div className="api-error" role="alert">{error}</div>}
      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your note a title..."
          disabled={isSubmitting}
          style={{ fontSize: '1.1rem', fontWeight: 600, padding: '0.85rem 1rem' }}
        />
      </div>
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="What's on your mind? (optional)"
          disabled={isSubmitting}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </Modal>
  );
};
export default NoteEditorModal;