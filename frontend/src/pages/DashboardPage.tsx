import React, { useContext, useEffect, useState, useRef } from 'react';
import DOMPurify from 'dompurify';
import { AuthContext } from '../context/AuthContext';
import notesService from '../services/notes.service';
import { Note } from '../types/notes.types';
import { ApiError } from '../types/auth.types';
import UserProfileModal from '../components/UserProfileModal';
import NoteEditorModal from '../components/NoteEditorModal';
import { io, Socket } from 'socket.io-client';

type SortOrder = 'newest' | 'oldest' | 'title-az' | 'title-za';

interface ImportNoteEntry {
  title: string;
  content: string;
}

function isImportNoteEntry(value: unknown): value is ImportNoteEntry {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj['title'] === 'string' && obj['title'].trim().length > 0;
}

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'p', 'br', 'h1', 'h2', 'h3', 'a'],
    ALLOWED_ATTR: ['href', 'rel'],
    FORCE_BODY: true,
    ADD_ATTR: ['rel'],
    FORBID_ATTR: ['style', 'class'],
  });
}

const DashboardPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const displayedNotes = notes
    .filter((note) => {
      const q = searchQuery.toLowerCase();
      const plainContent = note.content.replace(/<[^>]+>/g, '').toLowerCase();
      return note.title.toLowerCase().includes(q) || plainContent.includes(q);
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'title-az') return a.title.localeCompare(b.title);
      if (sortOrder === 'title-za') return b.title.localeCompare(a.title);
      return 0;
    });

  useEffect(() => {
    let isMounted = true;
    const fetchNotes = async () => {
      try {
        const response = await notesService.getNotes();
        if (isMounted) {
          if (response.success && response.data) {
            setNotes(response.data);
          } else {
            setError(response.error || 'Failed to fetch notes.');
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) setError(err.message);
          else if (err instanceof Error) setError(err.message);
          else setError('An unexpected error occurred while fetching notes.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchNotes();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!user) return;

    const apiUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(apiUrl, {
      query: { userId: user.id },
      withCredentials: true,
    });

    socketRef.current.on('NOTE_CREATED', (newNote: Note) => {
      setNotes((prev) => {
        if (prev.some((n) => n.id === newNote.id)) return prev;
        return [newNote, ...prev];
      });
    });

    socketRef.current.on('NOTE_UPDATED', (updatedNote: Note) => {
      setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    });

    socketRef.current.on('NOTE_DELETED', (deletedId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== deletedId));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  const handleCreateNote = async (title: string, content: string) => {
    setCreateError('');
    if (!title.trim()) {
      setCreateError('Title is required.');
      return;
    }
    setIsCreating(true);
    try {
      const response = await notesService.createNote({ title: title.trim(), content: content.trim() });
      if (response.success && response.data) {
        setNotes((prev) => {
          if (prev.some((n) => n.id === response.data!.id)) return prev;
          return [response.data!, ...prev];
        });
        setIsCreateModalOpen(false);
      } else {
        setCreateError(response.error || 'Failed to create note.');
      }
    } catch (err) {
      if (err instanceof ApiError) setCreateError(err.message);
      else if (err instanceof Error) setCreateError(err.message);
      else setCreateError('An unexpected error occurred while creating the note.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateNote = async (title: string, content: string) => {
    if (!editingNote) return;
    setEditError('');
    if (!title.trim()) {
      setEditError('Title is required.');
      return;
    }
    setIsUpdating(true);
    try {
      const response = await notesService.updateNote(editingNote.id, { title: title.trim(), content: content.trim() });
      if (response.success && response.data) {
        const updated = response.data;
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
        setEditingNote(null);
      } else {
        setEditError(response.error || 'Failed to update note.');
      }
    } catch (err) {
      if (err instanceof ApiError) setEditError(err.message);
      else if (err instanceof Error) setEditError(err.message);
      else setEditError('An unexpected error occurred while updating the note.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setDeletingNoteId(id);
    setDeleteError('');
    try {
      const response = await notesService.deleteNote(id);
      if (response.success) {
        setNotes((prev) => prev.filter((note) => note.id !== id));
      } else {
        setDeleteError(response.error || 'Failed to delete note.');
      }
    } catch (err) {
      if (err instanceof ApiError) setDeleteError(err.message);
      else if (err instanceof Error) setDeleteError(err.message);
      else setDeleteError('An unexpected error occurred while deleting the note.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_export_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw: unknown = JSON.parse(event.target?.result as string);

        if (!Array.isArray(raw)) {
          alert('Invalid file format. Expected a JSON array of notes.');
          return;
        }

        const sanitizedEntries: ImportNoteEntry[] = raw
          .filter(isImportNoteEntry)
          .map((entry) => ({
            title: entry.title.trim(),
            content: typeof entry.content === 'string' ? entry.content : '',
          }));

        if (sanitizedEntries.length === 0) {
          alert('No valid notes found in the file. Each note must have a non-empty title.');
          return;
        }

        const response = await notesService.importNotes(sanitizedEntries);
        if (response.success && response.data) {
          const newNotes = response.data;
          setNotes((prev) => {
            const map = new Map(prev.map((n) => [n.id, n]));
            newNotes.forEach((n) => map.set(n.id, n));
            return Array.from(map.values());
          });
        }
      } catch {
        alert('Failed to parse the JSON file. Please make sure it is a valid notes export.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div className="dashboard-top">
        <div className="dashboard-title-block">
          <h2 className="dashboard-title">My Notes</h2>
          <p className="dashboard-welcome">
            Good to see you, <strong>{user?.name || 'User'}</strong>!
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!loading && !error && (
            <span className="note-count-badge">
              📌 {notes.length} note{notes.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            type="button"
            className="dash-user-chip"
            onClick={() => setIsProfileModalOpen(true)}
            title="Account Settings"
          >
            <div className="dash-avatar">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span>{user?.name?.split(' ')[0] || 'User'}</span>
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="delete-error-banner" role="alert">
          {deleteError}
        </div>
      )}

      <div className="notes-controls">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search your notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="notes-search-input"
            aria-label="Search notes"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="notes-sort-select"
            aria-label="Sort notes"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title-az">Title (A-Z)</option>
            <option value="title-za">Title (Z-A)</option>
          </select>
          <button type="button" onClick={handleExport} className="btn-secondary" style={{ padding: '0.45rem 0.75rem', height: '100%' }}>
            Export
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ padding: '0.45rem 0.75rem', height: '100%' }}>
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading your notes...</div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h4>Oops, something went wrong</h4>
          <p>{error}</p>
          <button type="button" className="submit-btn" onClick={() => window.location.reload()} style={{ width: 'auto', marginTop: '0.5rem' }}>
            Try Again
          </button>
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h4>No notes yet</h4>
          <p>You haven't created any notes. Click the button below to capture your first idea.</p>
          <button type="button" className="submit-btn" onClick={() => setIsCreateModalOpen(true)} style={{ width: 'auto', marginTop: '0.5rem' }}>
            + Create your first note
          </button>
        </div>
      ) : (
        <>
          <div className="notes-section-header">
            <h3>All Notes</h3>
            <span className="notes-count">
              {displayedNotes.length} / {notes.length}
            </span>
          </div>

          {displayedNotes.length === 0 ? (
            <div className="no-results">
              No notes match your search &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="notes-grid">
              {displayedNotes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-card-body">
                    <div className="note-card-header">
                      <h4 className="note-card-title">{note.title}</h4>
                      <div className="note-card-actions">
                        <button
                          type="button"
                          className="btn-icon btn-icon-edit"
                          onClick={() => setEditingNote(note)}
                          aria-label={`Edit ${note.title}`}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className={`btn-icon btn-icon-delete ${deletingNoteId === note.id ? 'deleting' : ''}`}
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                          aria-label={`Delete ${note.title}`}
                        >
                          {deletingNoteId === note.id ? '...' : '🗑'}
                        </button>
                      </div>
                    </div>

                    <div
                      className="note-card-content"
                      dangerouslySetInnerHTML={{ __html: sanitize(note.content) }}
                    />

                    <div className="note-card-footer">
                      {new Date(note.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !error && (
        <button
          type="button"
          className="fab-new-note"
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Create new note"
          title="New Note"
        >
          +
        </button>
      )}

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <NoteEditorModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }}
        onSave={handleCreateNote}
        isSubmitting={isCreating}
        error={createError}
      />

      {editingNote && (
        <NoteEditorModal
          isOpen={true}
          onClose={() => { setEditingNote(null); setEditError(''); }}
          onSave={handleUpdateNote}
          initialTitle={editingNote.title}
          initialContent={editingNote.content}
          isSubmitting={isUpdating}
          error={editError}
        />
      )}
    </div>
  );
};

export default DashboardPage;
